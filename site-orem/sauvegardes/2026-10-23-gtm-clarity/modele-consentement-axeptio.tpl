___INFO___

{
  "type": "TAG",
  "id": "cvt_temp_public_id",
  "version": 1,
  "securityGroups": [],
  "displayName": "Consentement par défaut Axeptio (Orem)",
  "brand": {
    "id": "brand_dummy",
    "displayName": ""
  },
  "description": "Pose le consentement Google par défaut (refusé, ou le choix enregistré dans le cookie Axeptio) avant toute balise.",
  "containerContexts": [
    "WEB"
  ]
}


___TEMPLATE_PARAMETERS___

[]


___SANDBOXED_JS_FOR_WEB_TEMPLATE___

const setDefaultConsentState = require('setDefaultConsentState');
const getCookieValues = require('getCookieValues');
const JSON = require('JSON');

const types = ['analytics_storage', 'ad_storage', 'ad_user_data', 'ad_personalization'];
const state = {};
types.forEach(function (t) {
  state[t] = 'denied';
});

const cookies = getCookieValues('axeptio_cookies');
if (cookies.length) {
  const parsed = JSON.parse(cookies[0]);
  const g = parsed ? parsed['$$googleConsentMode'] : undefined;
  if (g) {
    types.forEach(function (t) {
      if (g[t] === 'granted' || g[t] === 'denied') state[t] = g[t];
    });
  }
}

state.wait_for_update = 500;
setDefaultConsentState(state);
data.gtmOnSuccess();


___WEB_PERMISSIONS___

[
  {
    "instance": {
      "key": {
        "publicId": "access_consent",
        "versionId": "1"
      },
      "param": [
        {
          "key": "consentTypes",
          "value": {
            "type": 2,
            "listItem": [
              {"type": 3, "mapKey": [{"type": 1, "string": "consentType"}, {"type": 1, "string": "read"}, {"type": 1, "string": "write"}], "mapValue": [{"type": 1, "string": "analytics_storage"}, {"type": 8, "boolean": false}, {"type": 8, "boolean": true}]},
              {"type": 3, "mapKey": [{"type": 1, "string": "consentType"}, {"type": 1, "string": "read"}, {"type": 1, "string": "write"}], "mapValue": [{"type": 1, "string": "ad_storage"}, {"type": 8, "boolean": false}, {"type": 8, "boolean": true}]},
              {"type": 3, "mapKey": [{"type": 1, "string": "consentType"}, {"type": 1, "string": "read"}, {"type": 1, "string": "write"}], "mapValue": [{"type": 1, "string": "ad_user_data"}, {"type": 8, "boolean": false}, {"type": 8, "boolean": true}]},
              {"type": 3, "mapKey": [{"type": 1, "string": "consentType"}, {"type": 1, "string": "read"}, {"type": 1, "string": "write"}], "mapValue": [{"type": 1, "string": "ad_personalization"}, {"type": 8, "boolean": false}, {"type": 8, "boolean": true}]},
              {"type": 3, "mapKey": [{"type": 1, "string": "consentType"}, {"type": 1, "string": "read"}, {"type": 1, "string": "write"}], "mapValue": [{"type": 1, "string": "wait_for_update"}, {"type": 8, "boolean": false}, {"type": 8, "boolean": true}]}
            ]
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "get_cookies",
        "versionId": "1"
      },
      "param": [
        {"key": "cookieAccess", "value": {"type": 1, "string": "specific"}},
        {"key": "cookieNames", "value": {"type": 2, "listItem": [{"type": 1, "string": "axeptio_cookies"}]}}
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  }
]


___TESTS___

scenarios: []
