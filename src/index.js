/// <reference types="@fastly/js-compute" />

import { env } from "fastly:env";
import { Router } from "@fastly/expressly";

console.log("FASTLY_HOSTNAME:", env("FASTLY_HOSTNAME"));
console.log("FASTLY_TRACE_ID:", env("FASTLY_TRACE_ID"));
console.log("FASTLY_SERVICE_VERSION:", env("FASTLY_SERVICE_VERSION"));

const BACKEND_NGWAF_API = "ngwaf_api_origin";
const BACKEND_APICLARITY = "apiclarity_origin";

const router = new Router();
router.use((req, res) => {
  res.headers.set("x-powered-by", "expressly");
});

router.get("/", async (req, res) => {
  return res.send("Hello world!");
});

router.post("/get_sampled_logs", async (req, res) => {
  const { 
    ngwaf_email,
    ngwaf_token,
    corpName,
    siteName,
    trace_source_token,
  } = await req.json();

  let ngwaf_sampled_logs = await get_sampled_logs(ngwaf_email, ngwaf_token, corpName, siteName);
  let ngwaf_sampled_json = await ngwaf_sampled_logs.json();
  let api_clarity_result = await send_to_apiclarity(ngwaf_sampled_json, trace_source_token);

  console.log(api_clarity_result);

  return res.send(JSON.stringify(ngwaf_sampled_json));
});

router.listen();

async function get_sampled_logs(ngwaf_email, ngwaf_token, corpName, siteName) {

  let from = Math.floor(Date.now()/1000) - 86400 - Math.floor(Date.now()/1000) % 60;
  let until = Math.floor(Date.now()/1000) - 300 - Math.floor(Date.now()/1000) % 60;
  
  // build the request for request sampling
  const url = `https://dashboard.signalsciences.net/api/v0/corps/${corpName}/sites/${siteName}/requests?q=from%3A${from}%20until%3A${until}`;
  const headers = {
    'x-api-user': ngwaf_email,
    'x-api-token': ngwaf_token,
  };  
  const options = {
    method: 'GET',
    headers: headers,
    backend: BACKEND_NGWAF_API
  };
  // Send the request for request sampling
  const resp = await fetch(url, options);
  return resp;
}

async function send_to_apiclarity(sampled_ngwaf_data, trace_source_token){
  // If there are no entries for data then return out of the function
  if (Object.keys(sampled_ngwaf_data.data).length < 1){
    return "No NGWAF Data"
  }

  let apiclarity_trace_format = {};
  const headers = {
    'X-Trace-Source-Token': trace_source_token,
    'content-type': 'application/json',
    'Accept': 'application/json',
  };
  let apiclarity_formatted_resp_headers = [];
  let apiclarity_formatted_req_headers = [];
  // let ngwaf_formatted_resp_headers = [];
  for (const ngwaf_entry of sampled_ngwaf_data.data) {

    // format the request headers
    apiclarity_formatted_req_headers = [];
    for (req_header of ngwaf_entry.headersIn){
      apiclarity_formatted_req_headers.push({
        "key": req_header[0],
        "value": req_header[1],
      });
    };

    // format the response headers
    apiclarity_formatted_resp_headers = [];
    for (resp_header of ngwaf_entry.headersOut){
      apiclarity_formatted_resp_headers.push({
        "key": resp_header[0],
        "value": resp_header[1],
      });
    };

    apiclarity_trace_format = {
      "requestID" : ngwaf_entry.id,
      "scheme": ngwaf_entry.scheme,
      "destinationAddress": "127.0.0.1:80",
      "destinationNamespace": "DESTNAMESPACEPLACEHOLDER",
      "sourceAddress": `${ngwaf_entry.remoteIP}:443`,
      "request": {
        "method": ngwaf_entry.method,
        "path": ngwaf_entry.path,
        "host": ngwaf_entry.serverName,
        "common": {
          "version": "1",
          "headers": apiclarity_formatted_req_headers,
          "body": "",
          "TruncatedBody": false
        }
      },
      "response": {
        "statusCode": `${ngwaf_entry.responseCode}`,
        "common": {
          "version": "1",
          "headers": null,
          "body": "",
          "TruncatedBody": false
        }
      }
    };

    // console.log(JSON.stringify(apiclarity_trace_format));
    
    const options = {
      method: 'POST',
      headers, headers,
      backend: BACKEND_APICLARITY,
      body: JSON.stringify(apiclarity_trace_format),
    };
    let apiclarity_resp = await fetch("http://apiclarity.local/api/telemetry", options);
    console.log(apiclarity_resp.status);
    console.log(await apiclarity_resp.text());
  }
  
  return "API Clarity Sent";
};

