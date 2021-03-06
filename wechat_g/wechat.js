'use strict'

var Promise = require('bluebird')
var request = Promise.promisify(require('request'))
var util = require('./util')
//https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET
var prefix = 'https://api.weixin.qq.com/cgi-bin/token'
var api = {
	accessToken : prefix + '?grant_type=client_credential'
}



function Wechat(opts) {
	var that = this
	this.appID = opts.appID
	this.appSecret = opts.appSecret
	this.getAccessToken = opts.getAccessToken
	this.saveAccessToken = opts.saveAccessToken

	this.getAccessToken()
		.then(function(data) {
			try {
				data = JSON.parse(data)
			}
			catch(e) {
				return that.updateAccessToken()
			}

			if (that.isValidAccessToken(data)) {
				return Promise.resolve(data)
			} else {
				return that.updateAccessToken()
			}
		})
		.then(function(data) {
			
			that.access_token = data.access_token
			that.expires_in = data.expires_in
			that.saveAccessToken(data)
		})
}

Wechat.prototype.isValidAccessToken = function(data) {
	if(!data || !data.access_token || !data.expires_in) {
		return false
	}

	var access_token = data.access_token
	var expires_in = data.expires_in
	var now = (new Date().getTime())

	if(now < expires_in) {
		return true
	} else {
		return false
	}
}

Wechat.prototype.updateAccessToken = function() {
	var appID = this.appID
	var appSecret = this.appSecret
	
	var url = api.accessToken + '&appid=' +appID + '&secret=' + appSecret

	return new Promise(function(resolve, reject) {
		request({url: url, json:true}).then(function(response) {
			//console.log(response)
			var data = response.body
			//console.log(data)
			var now = (new Date().getTime())
			var expires_in = now + (data.expires_in - 20) * 1000

			data.expires_in = expires_in
			resolve(data)
		})
	})
}

Wechat.prototype.reply = function() {
	var coontent = this.body
	var message = this.weixin
	var xml = util.tpl(content, message)

	this.status = 200
	this.type = 'application/xml'
	this.body = xml

}

module.exports = Wechat