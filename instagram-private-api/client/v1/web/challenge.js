var errors = require('request-promise/errors');
var Promise = require('bluebird');
var util = require('util');

var WebRequest = require('./web-request');
var Request = require('../request');
var Exceptions = require("../exceptions");

var SHARED_JSON_REGEXP = /window._sharedData = (.*);<\/script>/i

var Challenge = function(session, type, error, json) {
    this._json = json;
    this._session = session;
    this._type = type;
    this._error = error;
    this.apiUrl = error.apiUrl;
};

Challenge.handleResponse = async function handleChallengeResponse (response, checkpointError, defaultMethod) {
    const session = checkpointError.session
    let json
    try {
        json = JSON.parse(response.body);
    } catch (e) {
        if (response.body.includes('url=instagram://checkpoint/dismiss')) throw new Exceptions.NoChallengeRequired
        throw new TypeError('Invalid response. JSON expected')
    }
    //Using html unlock if native is not supported
    if (json.challenge && json.challenge.native_flow === false) return this.resolveHtml(checkpointError, defaultMethod)
    //Challenge is not required
    if (json.status === 'ok' && json.action === 'close') throw new Exceptions.NoChallengeRequired
    const apiChallengeUrl = 'https://i.instagram.com/api/v1'+checkpointError.json.challenge.api_path;
    //Using API-version of challenge
    switch (json.step_name) {
        case 'select_verify_method': {
            const selectResponse = await new WebRequest(session)
              .setMethod('POST')
              .setUrl(apiChallengeUrl)
              .setData({
                  'choice': json.step_data.choice,
              })
              .send({followRedirect: true})
            return this.handleResponse(selectResponse, checkpointError, defaultMethod)
        }
        case 'verify_code':
        case 'submit_phone':
            return new PhoneVerificationChallenge(session, 'phone', checkpointError, json)
        case 'verify_email':
            return new EmailVerificationChallenge(session, 'email', checkpointError, json)
        case 'delta_login_review':
            const deltaLoginResponse = await new WebRequest(session)
              .setMethod('POST')
              .setUrl(apiChallengeUrl)
              .setData({
                  'choice': 0 // 0 - It's was me // 1 - Not me, change password
              })
              .send({followRedirect: true})
            return this.handleResponse(deltaLoginResponse, checkpointError, defaultMethod)
        default:
            return new NotImplementedChallenge(session, json.step_name, checkpointError, json)
    }
}

//WARNING: This is NOT backward compatible code since most methods are not needed anymore. But you are free to make it backward compatible :)
//How does it works now?
//Well, we have two ways of resolving challange. Native and html versions.
//First of all we reset the challenge. Just to make sure we start from beginning;
//After if we check if we can use native api version. If not - using html;
//Selecting method and sending code is diffenent, depending on native or html style.
//As soon as we got the code we can confirm it using Native version.
//Oh, and code confirm is same now for email and phone checkpoints
Challenge.resolve = async function(checkpointError,defaultMethod,skipResetStep){
    checkpointError = checkpointError instanceof Exceptions.CheckpointError ? checkpointError : checkpointError.json;
    if(typeof defaultMethod==='undefined') defaultMethod = 'email';
    if(!(checkpointError instanceof Exceptions.CheckpointError)) throw new Error("`Challenge.resolve` method must get exception (type of `CheckpointError`) as a first argument");
    if(!['email','phone'].includes(defaultMethod)) throw new Error('Invalid default method');
    var session = checkpointError.session;

    const response = await Promise.try(async ()=>{
        if(skipResetStep) return new WebRequest(session)
          .setMethod('GET')
          .setUrl('https://i.instagram.com/api/v1'+checkpointError.json.challenge.api_path)
          .send({followRedirect: true})
        // dirty hack for handleResponse()
        return {
            body: JSON.stringify(await this.reset(checkpointError))
        }
    }).catch(errors.StatusCodeError, error => error.response)
    return this.handleResponse(response, checkpointError, defaultMethod);
}
Challenge.resolveHtml = function(checkpointError,defaultMethod){
    //Using html version
    var that = this;
    if(!(checkpointError instanceof Exceptions.CheckpointError)) throw new Error("`Challenge.resolve` method must get exception (type of `CheckpointError`) as a first argument");
    if(!['email','phone'].includes(defaultMethod)) throw new Error('Invalid default method');
    var session = checkpointError.session;

    return new WebRequest(session)
        .setMethod('GET')
        .setUrl(checkpointError.url)
        .setHeaders({
            'User-Agent': session.device.userAgentWeb(),
            'Referer': checkpointError.url,
        })
        .send({followRedirect: true})
        .catch(errors.StatusCodeError, function(error){
            return error.response;
        })
        .then(parseResponse)

    function parseResponse(response){
        try{
            var json,challenge,choice;
            if(response.headers['content-type'] === 'application/json'){
                json = JSON.parse(response.body);
                challenge=json;
            }else{
                json = JSON.parse(SHARED_JSON_REGEXP.exec(response.body)[1]);
                challenge = json.entry_data.Challenge[0];
            }
        }catch(e){
            throw new TypeError('Invalid response. JSON expected');
        }
        if(defaultMethod==='email'){
            choice = challenge.fields.email ? 1 : 0
        }else if(defaultMethod==='phone'){
            choice = challenge.fields.phone_number ? 0 : 1
        }

        switch(challenge.challengeType){
            case 'SelectVerificationMethodForm':{
                return new WebRequest(session)
                    .setMethod('POST')
                    .setUrl(checkpointError.url)
                    .setHeaders({
                        'User-Agent': session.device.userAgentWeb(),
                        'Referer': checkpointError.url,
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-Instagram-AJAX': 1
                    })
                    .setData({
                        "choice": choice
                    })
                    .send({followRedirect: true})
                    .then(function(){
                        return that.resolveHtml(checkpointError,defaultMethod)
                    })
            }
            case 'VerifyEmailCodeForm':
                return new EmailVerificationChallenge(session, 'email', checkpointError, json);
            case 'VerifySMSCodeForm':
                return new PhoneVerificationChallenge(session, 'phone', checkpointError, json);
            default: return new NotImplementedChallenge(session, challenge.challengeType, checkpointError, json);
        }
    }
}
Challenge.reset = function(checkpointError){
    var session = checkpointError.session;

    return new Request(session)
        .setMethod('POST')
        .setBodyType('form')
        .setUrl(checkpointError.apiUrl.replace('/challenge/','/challenge/reset/'))
        .signPayload()
        .send({followRedirect: true})
    .catch(function(error){
        return error.response;
    })
}
Challenge.prototype.code = function(code){
    var that = this;
    if(!code||code.length!==6) throw new Error('Invalid code provided');
    return new WebRequest(that.session)
        .setMethod('POST')
        .setUrl(that.apiUrl)
        .setBodyType('form')
        .setData({
            "security_code":code
        })
        .removeHeader('x-csrftoken')
        .send({followRedirect: false})
        .then(function(response){
            try{
                var json = JSON.parse(response.body);
            }catch(e){
                throw new TypeError('Invalid response. JSON expected');
            }
            if(response.statusCode === 200 && json.status==='ok' && (json.action==='close' || json.location==='instagram://checkpoint/dismiss')) return true;
            throw new Exceptions.NotPossibleToResolveChallenge('Unknown error',Exceptions.NotPossibleToResolveChallenge.CODE.UNKNOWN)
        })
        .catch(errors.StatusCodeError, function(error) {
            if(error.statusCode === 400)throw new Exceptions.NotPossibleToResolveChallenge("Verification has not been accepted",Exceptions.NotPossibleToResolveChallenge.CODE.NOT_ACCEPTED);
            throw error;
        })
}
exports.Challenge = Challenge;

Object.defineProperty(Challenge.prototype, "type", {
    get: function() { return this._type },
    set: function(val) {}
});
Object.defineProperty(Challenge.prototype, "session", {
    get: function() { return this._session },
    set: function(val) {}
});
Object.defineProperty(Challenge.prototype, "error", {
    get: function() { return this._error },
    set: function(val) {}
});
Object.defineProperty(Challenge.prototype, "json", {
    get: function() { return this._json },
    set: function(val) {}
});

var PhoneVerificationChallenge = function(session, type, checkpointError, json) {
    this.submitPhone = json.step_name==='submit_phone';
    Challenge.apply(this, arguments);
}
//Confirming phone number.
//We need to return PhoneVerificationChallenge that can be able to request code.
//So, if we need to submit phone number first - let's do it. If not - just return current PhoneVerificationChallenge;
PhoneVerificationChallenge.prototype.phone = function(phone){
    var that = this;
    if(!this.submitPhone) return Promise.resolve(this);
    let instaPhone = (that.json && that.json.step_data) ? that.json.step_data.phone_number : null;
    let _phone = phone || instaPhone;
    if(!_phone) return new Error('Invalid phone number');
    console.log(`Requesting phone`)
    return new WebRequest(that.session)
        .setMethod('POST')
        .setUrl(that.apiUrl)
        .setBodyType('form')
        .setData({
            "phone_number": _phone
        })
        .removeHeader('x-csrftoken')
        .send({followRedirect: false})
        .then(function(response){
            try{
                var json = JSON.parse(response.body);
            }catch(e){
                throw new TypeError('Invalid response. JSON expected');
            }
            return new PhoneVerificationChallenge(that.session, 'phone', that.error, json);
        })
}
util.inherits(PhoneVerificationChallenge, Challenge);
exports.PhoneVerificationChallenge = PhoneVerificationChallenge;

var EmailVerificationChallenge = function(session, type, checkpointError, json) {
    Challenge.apply(this, arguments);
}

util.inherits(EmailVerificationChallenge, Challenge);
exports.EmailVerificationChallenge = EmailVerificationChallenge;

var NotImplementedChallenge = function(session) {
    Challenge.apply(this, arguments);
    throw new Error("Not implemented, due to missing account for testing, please write me on email `ivan.ivan.90.90@gmail.com`")
}
util.inherits(NotImplementedChallenge, Challenge);
exports.NotImplementedChallenge = NotImplementedChallenge;
