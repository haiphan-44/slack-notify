#!/usr/bin/env node
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');

const CLIENT_ID = 'Iv1.b507a08c87ecfe98';
const headers_common = {
  accept: 'application/json',
  'editor-version': 'Neovim/0.6.1',
  'editor-plugin-version': 'copilot.vim/1.16.0',
  'content-type': 'application/json',
  'user-agent': 'GithubCopilot/1.155.0',
  'accept-encoding': 'gzip,deflate,br',
};
async function setup() {
  try {
    const resp = await fetch('https://github.com/login/device/code', {
      method: 'POST',
      headers: headers_common,
      body: JSON.stringify({
        client_id: CLIENT_ID,
        scope: 'read:user',
      }),
    });

    const resp_json = await resp.json();
    const device_code = resp_json.device_code;
    const user_code = resp_json.user_code;
    const verification_uri = resp_json.verification_uri;

    console.log(
      `Please visit ${verification_uri} and enter code ${user_code} to authenticate.`,
    );

    while (true) {
      //The reason to wait 5s is that github does not allow sending requests continuously
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const resp = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: headers_common,
        body: JSON.stringify({
          client_id: CLIENT_ID,
          device_code: device_code,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        }),
      });

      const resp_json = await resp.json();
      const access_token = resp_json.access_token;

      if (!access_token) continue;

      fs.writeFileSync('.copilot_token', access_token);
      console.log('Authentication success!,');
      console.log(
        'Token saved to .copilot_token, access_token: ',
        access_token,
      );
      break;
    }
  } catch (error) {
    console.log('🚀 --> error:', error);
  }
}

async function main() {
  setup();
}

main();
