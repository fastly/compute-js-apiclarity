# Integrate sampled Fastly Next-Gen WAF logs with APIClarity
Extract data from the NGWAF logs and send that request and response data to locally running APIClarity to document you API.

https://docs.fastly.com/en/ngwaf/extract-your-data

https://github.com/openclarity/apiclarity

## Pre-reqs

* [Fastly CLI](https://developer.fastly.com/learning/tools/cli/#installing)
* [Fastly Next-Gen WAF API Token](https://docs.fastly.com/en/ngwaf/using-our-api#creating-api-access-tokens)
* [npm](https://www.npmjs.com/)
* [kubectl](https://kubernetes.io/docs/reference/kubectl/)
* [docker cli](https://docs.docker.com/engine/reference/commandline/cli/)
* Must set the following environment variables
    * NGWAF_EMAIL 
    * NGWAF_TOKEN 
    * NGWAF_CORP 
    * NGWAF_SITE


# Quickstart

Make sure you have installed the necessary software in the pre-reqs.

## Build APIClarity and start a locally running Fastly Compute environment
Run `npm i` to install necessary packages.
Then just run `make build`

## Capture the APIClarity token and send a request to the Fastly Compute environment.
`make demo`
The request to Fastly Compute environment will do the following. 
* Query for a period of times worth of NGWAF Sampled logs
* Format that returned data for APIClarity
* Send the formatted data to APIClarity

## Access the APIClarity UI
Navigate to the URL at the end of the output from the previous `make demo` command to access the APIClarity UI. You will be able to generate an OpenAPI spec from APIClarity UI.

Capture the APIClarity Trace Source Token
```
TRACE_SOURCE_TOKEN=$(curl --http1.1 --insecure -s -H 'Content-Type: application/json' -d '{"name":"apigee_gateway","type":"APIGEE_X"}' https://localhost:8443/api/control/traceSources|jq -r '.token')
```

You may use `curl` or `http` to send the request to the locally running Fastly compute instance formatted like the following.

```
http http://127.0.0.1:7676/get_sampled_logs NGWAF_EMAIL=$NGWAF_EMAIL NGWAF_TOKEN=$NGWAF_TOKEN corpName=$NGWAF_CORP siteName=$NGWAF_SITE TRACE-SOURCE-TOKEN=$TRACE_SOURCE_TOKEN -p=b
```
