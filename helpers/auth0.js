'use strict';

const auth    = require( '../config' ).auth;

var ManagementClient = require('auth0').ManagementClient;

var auth0 = new ManagementClient({
    domain: auth.auth0_domain,
    clientId: auth.auth0_clientID,
    clientSecret: auth.auth0_clientSecret,
    scope: 'read:users update:users'
  });

  exports.updateUser = (user) => {
    console.log('updating auth0 user');
    console.log(user);
    if(!user.attributes.portalID || user.attributes.portalID.indexOf("auth0|") !== 0){
      console.log('Do not have auth0 ID');
      return Promise.resolve();
    }
    
    var metadata = {};
    if(user.attributes.firstName && user.attributes.lastName) metadata.full_name = user.attributes.firstName+' '+user.attributes.lastName;
    if(user.attributes.nickname) metadata.preferred_name = user.attributes.nickname;
    if(user.attributes.address) metadata.address = user.attributes.address;
    console.log('metadata for auth0', metadata);
    return auth0.updateUserMetadata({'id':user.attributes.portalID},metadata)
      .then((authUser) => {
        console.log('Got user from auth0');
        console.log(authUser);
        return authUser;
      })
  }

exports.resendVerifyEmail = (user) =>{
  
}