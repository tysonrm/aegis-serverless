curl --request POST \
  --url https://dev-2fe2iar6.us.auth0.com/oauth/token \
  --header 'content-type: application/json' \
  --data '{"client_id":"DdRHH6u5BsqprS03rtgFDv5p6xzCdEUK","client_secret":"0_c4fZKFG7Wyiu1u4YQWsRvBF3a68F6K-beqRLCNuBnQrGH8k0sFqRFmpwpI2ijX","audience":"https://microlib.io/","grant_type":"client_credentials"}' > public/token.json