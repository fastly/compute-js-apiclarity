# Integrate sampled Fastly Next-Gen WAF logs with APIclarity
Extract data from the NGWAF logs and send that request and response data to locally running APIclarity to document you API.

https://docs.fastly.com/en/ngwaf/extract-your-data

https://github.com/openclarity/apiclarity

## Pre-reqs

* [Fastly CLI](https://developer.fastly.com/learning/tools/cli/#installing)
* Fastly Next-Gen WAF API Token
* [npm](https://www.npmjs.com/)
* kubectl
* docker cli
* Must set the following environment variables
    * NGWAF_EMAIL 
    * NGWAF_TOKEN 
    * NGWAF_CORP 
    * NGWAF_SITE


# Quickstart

## Build APIclarity and start a locally running Fastly Compute environment
Run `npm i` to install necessary packages.
Then just run `make build`

## Capture the APIclarity token and send a request to the Fastly Compute environment.
`make demo`
The request to Fastly Compute environment will do the following. 
* Query for a period of times worth of NGWAF Sampled logs
* Format that returned data for APIclarity
* Send the formatted dat to APIclarity

Capture the APIclarity Trace Source Token
```
TRACE_SOURCE_TOKEN=$(curl --http1.1 --insecure -s -H 'Content-Type: application/json' -d '{"name":"apigee_gateway","type":"APIGEE_X"}' https://localhost:8443/api/control/traceSources|jq -r '.token')
```

You may use `curl` or `http` to send the request to the locally running Fastly compute instance formatted like the following.

```
http http://127.0.0.1:7676/get_sampled_logs NGWAF_EMAIL=$NGWAF_EMAIL NGWAF_TOKEN=$NGWAF_TOKEN corpName=$NGWAF_CORP siteName=$NGWAF_SITE TRACE-SOURCE-TOKEN=$TRACE_SOURCE_TOKEN -p=b
```
