const express = require('express')
const app = express()
const port = 7001
var initTracer = require('jaeger-client').initTracer;
const opentracing = require("opentracing");
const bodyParser = require('body-parser');
const mysql = require('mysql');

var config = {
  'serviceName': 'order-service',
  'local_agent': {
    'reporting_host': 'jaeger',
    'reporting_port': '6831',
},
  'reporter': {
    'logSpans': true    
  },
  'sampler': {	
    'type': 'const',
    'param': 1.0
  }
};
var options = {
  'tags': {
    'order-service': '1.1.2'
  }
};

var tracer = initTracer(config, options);
opentracing.initGlobalTracer(tracer);

app.use(bodyParser.json({ type: 'application/*+json' }));

const fs = require('fs');

let rawdata = fs.readFileSync('order.json');  
let orders = JSON.parse(rawdata);  
console.log(orders)
app.get('/orders/1', (req, res) => 
{
    const wireCtx = tracer.extract(opentracing.FORMAT_HTTP_HEADERS, req.headers)
    const span = tracer.startSpan('order-service', { childOf: req.span }) 
    span.setTag(opentracing.Tags.HTTP_METHOD, req.method)
  span.setTag(opentracing.Tags.SPAN_KIND, opentracing.Tags.SPAN_KIND_RPC_SERVER)
  span.setTag(opentracing.Tags.HTTP_URL, req.path) 
 
    res.send(JSON.stringify(orders))
    span.log({'event': 'request_end'});
    span.finish();
});

app.use(express.static('public'));

app.listen(port, () => console.log(`Order Service is running on ${port}!`));