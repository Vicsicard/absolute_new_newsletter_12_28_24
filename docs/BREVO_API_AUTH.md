# Brevo API Authentication Documentation

## Official Documentation
<!-- Add the authentication documentation content below this line -->
Using your API key to authenticate
You will need an account on Brevo. You can create one from our signup page for free.
Once you confirmed your account, get your API key from your settings (SMTP & API).

While logged into your account, click on your name at the top-right side of the screen.

Click SMTP & API.

Under the API keys tab, click Generate a new API key.


Name your API key.

Click Generate.

Copy your API key and save it somewhere safe.


Click OK.

This API key will be used for each request you make, to identify who you are and check your account's credentials.

With this API key, you'll be ready to start calling Brevo API.


Get going faster with these 4 minute recipes...
Import all your contacts in PHP
Open Recipe
Send Transactional Emails in PHP
Open Recipe
Batch Send Customised HTML Emails in Node.js
Open Recipe
Send a Transactional Email in Python
Open Recipe
Create or Update a Contact in PHP
Open Recipe



What can you do with Brevo API?
Email API
• Learn how to create and send "triggered" emails such as order confirmations, password resets, and confirmation emails.

• Manage your email templates and get deliverability reports.

All features available
Email Campaign
• Create and send beautifully designed campaigns such as newsletters and release announcement emails.

• Generate a report for your previously scheduled campaigns and share it with specific email addresses.

All features available
SMS Campaigns
• Create SMS campaigns and send announcements or promotional offers as text messages to your customers.

• Generate a report for your passed and ongoing SMS campaigns and share it with specifc email addresses

All features available
Transactional SMS
• Send text messages at key moments to notify your clients about a shipment status for instance or to inform them about their confirmation code.

All features available
Contacts
• Everything you need to know about how to manage your contacts and how to import & export them to your Brevo account.

• Also, learn about how to get campaign statistics for a specific contact.

All features available
Automation
• Learn how to track the activity of a visitor on your website and create automation workflows to send abandoned cart follow-ups and much more!

Working on marketing automation
Follow the specific documentation on Brevo Tracker
👍
Need Help ?

We’re always happy to help. Get in touch with us by sending a message to support@brevo.com (an account on Brevo is required).

Updated 3 months ago

What’s Next
How the API works
Import your contacts to Brevo
Send a transactional email
Track your website activity
Did this page help you?
Authentication
Suggest Edits
There are mainly two types of authentication schemes that Brevo employs:

Api-key authentication
This type of authentication is already being used in our public API reference. You can verify your identity by using your api-key to send a request to the API endpoints. You get the API key from your Brevo profile menu in your Brevo account. You can find SMTP and API in your profile menu. Click on it and move to the API tab and you can find your API-key there. You can create new API-keys too for every use case or feature and you can provide a specific naming criteria for every API-key. For more help you can consult the guide to get your API-key here.


OAuth authentication 🆕
Prefer OAuth whenever if you are building enterprise grade integrations or if you are considering to create an App or Plugin that you would like to list in our marketplace.

OAuth provides both Authentication and Authorization within one single flow. It works by the API server providing a token as authentication proof to access a certain feature. The token has a defined period of validity . This token is then sent to the authentication server which provides the permissions and authorizes access for the user.

Updated 6 months ago

What’s Next
OAuth 2.0 🆕
Did this page help you?
Table of Contents
Api-key authentication

REST API: Key Concepts
Learn the key concepts on Brevo API

Suggest Edits
Here is everything you need to understand before starting using the API.

Endpoints
The API is accessed by making HTTPS requests to a specific version endpoint URL, in which GET, POST, PUT, and DELETE methods dictate how your interact with the objects available. Every endpoint is accessed only via the SSL-enabled HTTPS (port 443) protocol.

Every call must contain the version number. The latest version is v3.

Endpoint

https://api.brevo.com/v3/
Requests
Requests must be sent over HTTPS with any payload formatted in JSON (application/json). Every request must include the headers content-type: application/json and api-key.

The API key can be retrieved from the account settings. Make sure to get the key for the version of the API you're using.

Example request
PHP
Node.js
Ruby
Python
Java
TypeScript
Other

curl -X POST 'https://api.brevo.com/v3/contacts'
     -H 'content-type: application/json'
     -H 'api-key: YOUR_API_KEY'
     -d '{"email":"john@doe.com"}'
Rate limiting
Our endpoint list has been optimised in such way that we ensure the critical routes can efficiently handle as many requests as possible without compromising stability. You can refer to the limits for each endpoint in this section.

Pagination
Depending on the endpoint and on your request, the results returned may be paginated. You can page through the results by using following parameters in the query string.

Name	Type	Description
limit	integer	The number of results returned per page. The default and maximum value may vary per API
offset	integer	The index of the first document in the page (starting with 0). For example, if the limit is 50 and you want to retrieve the page 2, then offset=50
cURL

curl -X GET "https://api.brevo.com/v3/contacts?limit=100&offset=2"
     -H "api-key: xkeysib-xxx"
     -H "content-type: application/json"
Responses
Format
Each response can either be empty - for example in case of an update which returns an http 204 response and doesn't need to return additional infos - or a JSON object.

In case of success the JSON object returned for each endpoint is different.

An error object will contain an error code and a human readable description of the error.

Success Response
Error Response

{
  "ips": [
    {
      "id": 3,
      "ip": "123.65.8.22",
      "domain": "mailing.myshop.dom"
    },
    {
      "id": 5,
      "ip": "123.43.21.3",
      "domain": "newsletter.myshop.dom"
    }
  ]
}
HTTP response codes
Please find below, the HTTP response codes that can be returned by Brevo API:

HTTP code	Status	Description
200	OK	The request was successful
201	Created	The object was successfully created
202	Accepted	The request was accepted and will be processed
204	No content	The object was successfully updated or deleted
400	Bad request	Request is invalid. Check the error code in JSON
401	Unauthorized	You have not been authenticated. Make sure the provided api-key is correct
402	Payment Required	Make sure you're account is activated and that you've sufficient credits
403	Forbidden	You do not have the rights to access the resource
404	Not Found	Make sure your calling an existing endpoint and that the parameters (object id etc.) in the path are correct
405	Method Not Allowed	The verb you're using is not allowed for this endpoint. Make sure you're using the correct method (GET, POST, PUT, DELETE)
406	Not Acceptable	The value of contentType for PUT or POST request in request headers is not application/json. Make sure the value is application/json only and not empty
429	Too Many Requests	The expected rate limit is exceeded. Refer here
Error codes
Please find bellow the codes returned in the JSON body in case of an error.

Code	Explanation
invalid_parameter	The value of the parameter you have provided is not valid. Please check the format and the type
missing_parameter	One of the required parameter is missing to perform the request
out_of_range	The value of the parameter you have provided is not included in the authorized range
unauthorized	You are not authorized to do this call
document_not_found	The parameter value in brackets {} is not found
method_not_allowed	The method you are requesting for this path is not allowed. (ex : you are doing put but only get method is allowed for the path
not_enough_credits	You don't have enough credit to perform the request. Example : you are trying to send a campaign but your plan has expired
duplicate_parameter	One of the parameters in the request already exists.
duplicate_request	The request rate of the very same request is too high
account_under_validation	Your account is under validation
permission_denied	You don't have the permission to perform this request
Brevo IP addresses
Some applications might find it handy to know about Brevo IPs. This page is intended to be the definitive source of Brevo current IP ranges. We will add new IPs over time.
API rate limits
You will find here all the information regarding how to properly execute API calls in bulks.

Suggest Edits
We have redefined our rate limit policies in 2023 to better fit your needs and scale as you grow. In some cases it might require you to adapt your integration to these changes.

Our public API is a service accessible to all Brevo users, we want to provide the best possible experience when you integrate to our platform. In order to ensure this we have put in place some limits to the number of API requests that can be executed over a period of time.


General Rate Limiting
Our endpoint list has been optimised in such way that we ensure the critical routes can efficiently handle as many requests as possible without compromising stability. This translates to the following numbers:

Endpoint	Rate Limiting	Granularity per second
POST /v3/smtp/email
GET /v3/smtp/blockedContacts	3 600 000 RPH	1000 RPS
POST /v3/transactionalSMS/sms	540 000 RPH	150 RPS
POST /v3/events	36 000 RPH	10 RPS
**All endpoints under/v3/smtp/{…})	300 RPH	-
All endpoints under
/v3/contacts/{…}	36 000 RPH	10 RPS
All other endpoints	100 RPH	-
**This rule excludes the routes POST /v3/smtp/email and GET /v3/smtp/blockedContacts which have their own dedicated rate limits.

RPS: HTTP requests per second
RPH: HTTP requests per hour



Enterprise Rate Limiting
If your account is under an Enterprise plan all your API keys will have access to our extended rate limit policy which allows to scale your application accordingly.

Endpoint	Rate Limiting	Granularity per second
POST /v3/smtp/email |
GET /v3/smtp/blockedContacts	7 200 000 RPH	2000 RPS
POST /v3/transactionalSMS/sms	720 000 RPH	200 RPS
POST /v3/events	72 000 RPH	20 RPS
**All endpoints under/v3/smtp/{…}	600 RPH	-
All endpoints under
/v3/contacts/{…}	72 000 RPH	20 RPS
All other endpoints	200 RPH	-
**This rule excludes the routes POST /v3/smtp/email and GET /v3/smtp/blockedContacts which have their own dedicated rate limits.

RPS: HTTP requests per second
RPH: HTTP requests per hour


Rate Limit Add-On
If your account is under an enterprise plan and you would still require more throughput for your API operations you can apply for a rate limit add-on on top of your existing policy. This will allow you to scale your integration way further than conventional limits.

📘
Request an extended rate limit

If your integrations require an increased rate limit policy please reach out to our sales team here. We will be glad to scale the rate limit to fit your needs.


How to prevent my API requests from being rejected ?
If you execute request bursts in shorter timeframes other than the specified above you might get as a result a 429 status code or "Too many requests". This means you're hitting the limit for the number of requests allowed for a unique endpoint. Here are some recommendations on how to prevent this error:

1- Make sure you properly calculate your rate limit allowance. You need to send your bulk requests equally distributed through the specified time granularity. E.g 1000 RPS = up to 60K requests per minute.

2- Considering moving to a higher rate limit tier if you application needs to scale. You will need an Enterprise plan. You can contact our sales team here .

3- If you would like to fetch the statistics for your marketing or transactional email integration. We encourage you implement an event driven mechanism by making use of our webhook platform. You can learn more about this topic here.

Rate limit reset
When the user receives a 429 status code for rate limiting, they receive headers which show the remaining time until the limit is reset. The headers are mentioned below

Header name	Description
x-sib-ratelimit-limit	This is the limit of the requests before a 429 status code
x-sib-ratelimit-remaining	This is the remaining limit of requests
x-sib-ratelimit-reset	Shows the unit in the granularity the RL is set. In the case below it is 999 available in the current 1 second


Updated 2 months ago
Platform quotas
Suggest Edits
We make use of quotas to limit your create actions for some relevant objects in our platform. The quotas represent some countable objects created via the API for a particular service or product.

The quotas are applied to each active account on Brevo. Quotas apply to all main API actions, such as creating campaigns or adding contacts. The limits also apply to actions done through the UI or via other connectors and integrations.

If you reach a quota limit then you will need to perform delete actions on objects you might not be using on your account in order to create new ones.


Marketing platform quotas
Total created email campaigns
Description: Maximum count of campaigns stored in your account including drafts.
Endpoint: Create an email campaign

General quota	Enterprise quota
10000 email campaigns	50000 email campaigns
Total created SMS campaigns
Description: Maximum count of campaigns stored in your account including drafts.
Endpoint: Create an SMS campaign

General quota	Enterprise quota
300 SMS campaigns	600 SMS campaigns
Total scheduled email campaigns
Description: Maximum count of scheduled campaigns in your account at the same time.
Endpoint: Create an email campaign

General quota	Enterprise quota
150 scheduled campaigns	300 scheduled campaigns
Total amount of media uploaded to content library
Description: Maximum amount (GBs) of media pushed to the content library.
Endpoint: Upload an image to your account's image gallery

General quota	Enterprise quota
2 Gb of media files	5 Gb of media files
Total active automation worfkows
Description: Maximum count of active marketing automation workflows in your account at the same time.
Guide: Custom Automation workflows
Note this quota is restricted to one account per company on the Starter Plan. It can be customised on Enterprise plans.

General quota	Enterprise quota
50 active workflows	500 active workflows



Contact management quotas
Total stored contacts
Description: Maximum count of contacts stored on your account.
Endpoint: Create a contact

General quota	Enterprise quota
5M stored contacts	900M stored contacts
Total created contact attributes
Description: Maximum number of attributes in your contact lists.
Endpoint: Create a contact attribute

General quota	Enterprise quota
200 contact attributes	200 contact attributes
Total created contact lists
Description: Maximum number of contacts lists created on your account
Endpoint: Create a list

General quota	Enterprise quota
300 created lists	600 created lists
Total created contact folders
Description: Maximum number of contact folders created on your account.
Endpoint: Create a folder

General quota	Enterprise quota
300 created folders	300 created folders
EMAIL | Send a transactional message
Learn how to send a transactional email for an existing template and adding dynamic content

Suggest Edits
Transactional emails are used for all non-promotional emails: send them when a user has created an account, when they have made an order, when request a new password...

👍
What you will learn from this tutorial

In this tutorial, you will learn how to:

send a basic transactional email with a dummy HTML content.

send a transactional email where we'll insert dynamic contact attributes (ex. contact name, address) and transactional parameters (ex. order number, expected date of delivery).

Requirements
Get your API key from your settings (SMTP & API).

If you are new to the API, read more about how the api works.

Send a transactional email using a basic HTML content
Let's assume we would like to send the following basic email.

HTML content	<html><head></head><body><p>Hello,</p>This is my first transactional email sent from Brevo.</p></body></html>
Email subject	"Hello worldl"
Sender name	"Sender Alex"
Sender email	"email":"senderalex@example.com"
Recipient name	"John Doe"
Recipient email	"email":"johndoe@example.com"
The HTTP request to send using cURL is the following:

cURL

curl --request POST \
  --url https://api.brevo.com/v3/smtp/email \
  --header 'accept: application/json' \
  --header 'api-key:YOUR_API_KEY' \
  --header 'content-type: application/json' \
  --data '{  
   "sender":{  
      "name":"Sender Alex",
      "email":"senderalex@example.com"
   },
   "to":[  
      {  
         "email":"testmail@example.com",
         "name":"John Doe"
      }
   ],
   "subject":"Hello world",
   "htmlContent":"<html><head></head><body><p>Hello,</p>This is my first transactional email sent from Brevo.</p></body></html>"
}'
Send a transactional email containing dynamic contact attributes and transactional parameters
In this tutorial, we'll be sending an order confirmation email to a contact, where we'll insert dynamic contact attributes (contact name, address) and transactional parameters (order number, expected date of delivery).

For the sake of simplicity, we'll use an existing email template to design our email.

This is the email you should get by the end of the tutorial:



Create a test template that includes dynamic content
To get started quickly, let's create the email template from Brevo dashboard.

First, go to the template creation page
Choose your settings and click Next Step
Under Template Name, enter "Order confirmation"
Under Subject Line, enter "Your new order has been received"
Pick an existing sender for the From Email
Enter your company name under From Name


Once directed the Design tab, select the "Import a template" tab, and copy and paste the following Shared Template URL: https://my.brevo.com/iNF7GRiE34wzuyVRWobyyLLNbttWwwKn8CQLDhU7kui0HXu4tZG_ZzZ6Ng--


Click "Import" next to the URL. You should be redirected to the following page bellow.
Click the "Save & Quit" button, then on the new page " Save and Activate".


Go back to the templates page and save the template id of the one you just created for later. The id of the template is the number after the "#" after the template name.


📘
Template creation using the API

Creating a template using the API is possible, but more limited. Using the Create an smtp template endpoint, you can create a template:

by passing the html content as a string (htmlContent)
by passing the html content available at a URL (htmlUrl)
Add a contact attribute for the delivery address
By default, a contact comes with the attributes EMAIL, FIRSTNAME, LASTNAME, SMS. Let's add the DELIVERYADDRESS so we can use it fill our template when sending an email.

Go to the contact attributes page (under Contact > Settings > Contact Attributes & CRM) and add a new field DELIVERYADDRESS.


Go to your contact page and add a new contact:
FIRSTNAME: John
LASTNAME: Doe
EMAIL: set up your email to receive the test email
DELIVERYADDRESS: 75014 Paris, France
Select any contact list you want to import this contact into



Click " Save and Close".
📘
Managing contacts

💡 These features are also available through the API. The endpoints that will help you are Creates contact attribute and Create a contact. You can also follow the tutorial on how to synchronise contact lists to be guided through the steps.

👍 That's it! Now let's send our first email!

Send your transactional email
Let's learn how to use the API. The best way to know what's possible and how to use each endpoint is to go to the API Reference.

Under SMTP > Send a transactional email, you can find the description of the endpoint:



1. Generate a code snippet to quickly test your request:
Enter the body and path parameters to send in your request. These are the ones we'll need:
sender: Enter your sender email and name
💡 the sender email must be a sender registered and verified in Brevo
💡 the sender name parameter here can override the default sender name you have set
to: Enter your recipient email and name
💡 the recipient email should be a contact registered in Brevo and assigned to a contact list. That contact should have the attributes FIRSTNAME, LASTNAME, EMAIL, DELIVERYADDRESS defined.
💡 the recipient name here is the name that will be attached to the email recipient. It will appear in the email headers/metadata and not in the email body.
templateId : Enter your template id
Get the list from the templates page or using the endpoint to get the list of SMTP templates
params: the value we will use is {"ORDER": 12345, "DATE": "12/06/2019"}
Try out the endpoint from the interface. For that, click the " Try it" button and enter you API key
If everything goes well, you should get a success response (code 201) with a JSON body giving you the id of the message sent. ex: {"messageId":"<201906041124.44340027797@smtp-relay.mailin.fr>"}.
Notice that the order number and delivery date will be missing from the email received. The reason is that using the API reference interface, you cannot specify rich JSON body parameters like the params to provide DATE and ORDER, so you'll have to use the code snippets and test using cURL or using other integrations. Go to next section for more details.
If the parameters you entered are wrong, you'll get a 400 error along with an error message and error code. Find the list of errors here.
🚧
API Reference limitations and rating

When you try an endpoint, you will make a real call to the API.
Make sure to check rate limits and your credits as the API reference will use them to make the requests (when sending an email or an sms for instance).

Read more about Brevo sending email bandwidth and quota

Creating your API request using Brevo API clients:
The code snippets in the API Reference are only there for you to test your API quickly and in the language that suits you.

👍 For your integration, we recommend you use our API clients that will provide you with shortcuts and ease of integration.
Available API clients and their documentations: C#, Go, Java, Node JS, PHP, Python, Ruby.

Here are sample codes using the API clients. Before using then, follow the installation guide from each documentation linked above.

cURL - Using a template
cURL - Using HTML content
PHP
Node.js
Ruby
Python
TypeScript

curl --request POST \
  --url https://api.brevo.com/v3/smtp/email \
  --header 'accept: application/json' \
  --header 'api-key:YOUR_API_KEY' \
  --header 'content-type: application/json' \
  --data '{  
   "to":[  
      {  
         "email":"testmail@example.com",
         "name":"John Doe"
      }
   ],
   "templateId":8,
   "params":{  
      "name":"John",
      "surname":"Doe"
   },
   "headers":{  
      "X-Mailin-custom":"custom_header_1:custom_value_1|custom_header_2:custom_value_2|custom_header_3:custom_value_3",
      "charset":"iso-8859-1"
   }
}'
👍
For each request, make sure to include the following headers:

api-key: xkeysib-xxxxxxxxxxxxxxxxx
content-type: application/json
accept: application/json
👍 Check your emails! Congratulations, you've just sent your first transactional email using Brevo API!



Tracking your transactional activity through Webhooks.
If you would like to additionally track the status of your message there's a number of events you can look after with webhooks. Here is the full list:

Sent , Delivered, Opened, Clicked, Soft Bounce, Hard Bounce, Invalid Email, Deferred, Complaint, Unsubscribed, Blocked, Error.



We must create a webhook definition to which we will be posting all the event data. This can be easily done through the transactional webhooks page. . Here you need to specify the URL of the server which will be receiving the incoming data from Brevo. Also, you need to check which events you are interested to track.
transactional webhooks page
transactional webhooks page

📘
Managing Webhooks

You can also do these actions straight from the API, if you prefer. The endpoints that will help you are Create a webhook and Update a webhook in case you want to change the webhook definition.




We chose to track the delivered event in the previous step. Brevo will post the event specific data to your URL every time a transactional email is delivered to the recipient's inbox. Let's send another email:
cURL

curl --request POST \
  --url https://api.brevo.com/v3/smtp/email \
  --header 'accept: application/json' \
  --header 'api-key: xkeysib-xxxxxxxxxxx' \
  --header 'content-type: application/json' \
  --data '{
  "sender":{"email":"sender@example.com"},
  "to":[{"email":"recipient@example.com"}],
  "replyTo":{"email":"sender@example.com"},
  "textContent":"This is a transactional email",
  "subject":"Subject Line",
  "tags":["myFirstTransactional"]
  }'
📘
Pro Tip

When sending a transactional email you can also pass the tags object to specify a custom flag or identifier which could help you query through the received events on your side.




Once our message is delivered the following data will be posted to your URL. You can expect the same structure every time an event of the same kind is triggered.
cURL

{
  "event": "delivered",
  "email": "example@example.com",
  "id": 26224,
  "date": "YYYY-MM-DD HH:mm:ss",
  "ts": 1598634509,
  "message-id": "<xxxxxxxxxxxx.xxxxxxxxx@domain.com>",
  "ts_event": 1598034509,
  "subject": "Subject Line",
  "tag": "[\"transactionalTag\"]",
  "sending_ip": "185.41.28.109",
  "ts_epoch": 1598634509223,
  "tags": [
    "myFirstTransactional"
  ]
}
Note: You can take a closer look to all the event specific payload in this help article.

Updated 7 months ago
Schedule transactional emails.
Schedule individual emails or message batches

Suggest Edits
Scheduling transactional batches comes in handy when you need to send high volumes at the same time. If you hit the transactional endpoint in bursts at the same time you might have trouble handling all the asynchronous calls. Having the possibility to schedule ahead your send out makes it easier to process all the API calls in advance.

In this guide we will cover:

Defining scheduled batches
Retrieving scheduled batches
Canceling scheduled batches
Defining scheduled batches
In order to define a scheduled batch or an individual scheduled message you need to make use of the scheduledAt parameter when calling the Send a Transactional Message Endpoint. This parameter takes a standard ISO formatted datetime value to which you can specify a different timezone by adding hours like so :

Note : You can schedule a message up to 72 hours in the future (from the moment the API request is executed)

JSON

{
    "sender": {
        "email": "hello@brevo.com"
    },
    "subject": "This is my default subject line",
    "templateId": 43,
    "params": {
        "greeting": "This is the default greeting",
        "headline": "This is the default headline"
    },
    "scheduledAt":"2022-02-28T14:22:51.970+05:30",
    "messageVersions": [
        {
            "to": [
                {
                    "email": "recipient0@brevo.com"
                }
            ],
            "params": {
                "greeting": "Hello again!",
                "headline": "Take advantage of our summer deals, taylored just for you"
            },
            "subject": "Some deals worth to be looked at!"
        },
        {
            "to": [
                {
                    "email": "recipient1@brevo.com"
                }
            ],
            "params": {
                "greeting": "Hello Marie, we have prepared some exclusive summer deals for you.",
                "headline": "Some bathing suits you might like"
            },
            "subject": "Marie, new bathing suits are here."
        }
    ]
}
📘
Sending multiple correlated batches at a specific time.

If you would like to execute the transactional endpoint multiple times at a specific time in the future, you can easily track the state of your send outs by simply passing a batchId parameter, this will allow you to link all your messages to a unique identifier and simplify the overall tracking of your batch operations.

We reccomend making use of UUIDs for thus purpose.

batchId: 275d3289-d5cb-4768-9460-a990054b6c81

Retrieve scheduled batches
Here is where we will make use of our earlier dicussed batchId. In the request parameters you simply need to pass your UUID value and you will get an API response containing all the information about the state of your scheduled job.

If you have scheduled a single transactional email , then you can simply pass the messageId you got in the API response from that action.

Endpoint: Fetch scheduled emails by batchId or messageId

GET https://api.brevo.com/v3/smtp/emailStatus/{identifier}

📘
The identifier field should be either:

-The messageId, if it's a single email.
-The batchId, if it's a batch sending.

Response

{
  "count": 3,
  "batches": [
    {
      "scheduledAt": "2022-02-28T11:36:43.576000000Z",
      "createdAt": "2022-02-26T11:36:43.576000000Z",
      "status": "queued"
    },
    {
      "scheduledAt": "2022-02-25T11:36:43.576000000Z",
      "createdAt": "2022-02-24T11:36:43.576000000Z",
      "status": "processed"
    },
    {
      "scheduledAt": "2022-02-26T11:36:43.576000000Z",
      "createdAt": "2022-02-25T11:36:43.576000000Z",
      "status": "inProgress"
    }
  ]
}
Canceling scheduled batches
In case you mistakenly scheduled one or a series of batch calls by mistake you can always delete them from the queue by passing the batchId this will abort the scheduled operation once you receive a successful response status.

Endpoint: Delete scheduled emails by batchId or messageId

DELETE https://api.brevo.com/v3/smtp/email/{identifier}

📘
The identifier field should be either:

-The messageId, if it's a single email.
-The batchId, if it's a batch sending.

You should receive a 204 status code once the delete action has gone through.
REST API: Key Concepts
Learn the key concepts on Brevo API

Suggest Edits
Here is everything you need to understand before starting using the API.

Endpoints
The API is accessed by making HTTPS requests to a specific version endpoint URL, in which GET, POST, PUT, and DELETE methods dictate how your interact with the objects available. Every endpoint is accessed only via the SSL-enabled HTTPS (port 443) protocol.

Every call must contain the version number. The latest version is v3.

Endpoint

https://api.brevo.com/v3/
Requests
Requests must be sent over HTTPS with any payload formatted in JSON (application/json). Every request must include the headers content-type: application/json and api-key.

The API key can be retrieved from the account settings. Make sure to get the key for the version of the API you're using.

Example request
PHP
Node.js
Ruby
Python
Java
TypeScript
Other

curl -X POST 'https://api.brevo.com/v3/contacts'
     -H 'content-type: application/json'
     -H 'api-key: YOUR_API_KEY'
     -d '{"email":"john@doe.com"}'
Rate limiting
Our endpoint list has been optimised in such way that we ensure the critical routes can efficiently handle as many requests as possible without compromising stability. You can refer to the limits for each endpoint in this section.

Pagination
Depending on the endpoint and on your request, the results returned may be paginated. You can page through the results by using following parameters in the query string.

Name	Type	Description
limit	integer	The number of results returned per page. The default and maximum value may vary per API
offset	integer	The index of the first document in the page (starting with 0). For example, if the limit is 50 and you want to retrieve the page 2, then offset=50
cURL

curl -X GET "https://api.brevo.com/v3/contacts?limit=100&offset=2"
     -H "api-key: xkeysib-xxx"
     -H "content-type: application/json"
Responses
Format
Each response can either be empty - for example in case of an update which returns an http 204 response and doesn't need to return additional infos - or a JSON object.

In case of success the JSON object returned for each endpoint is different.

An error object will contain an error code and a human readable description of the error.

Success Response
Error Response

{
  "ips": [
    {
      "id": 3,
      "ip": "123.65.8.22",
      "domain": "mailing.myshop.dom"
    },
    {
      "id": 5,
      "ip": "123.43.21.3",
      "domain": "newsletter.myshop.dom"
    }
  ]
}
HTTP response codes
Please find below, the HTTP response codes that can be returned by Brevo API:

HTTP code	Status	Description
200	OK	The request was successful
201	Created	The object was successfully created
202	Accepted	The request was accepted and will be processed
204	No content	The object was successfully updated or deleted
400	Bad request	Request is invalid. Check the error code in JSON
401	Unauthorized	You have not been authenticated. Make sure the provided api-key is correct
402	Payment Required	Make sure you're account is activated and that you've sufficient credits
403	Forbidden	You do not have the rights to access the resource
404	Not Found	Make sure your calling an existing endpoint and that the parameters (object id etc.) in the path are correct
405	Method Not Allowed	The verb you're using is not allowed for this endpoint. Make sure you're using the correct method (GET, POST, PUT, DELETE)
406	Not Acceptable	The value of contentType for PUT or POST request in request headers is not application/json. Make sure the value is application/json only and not empty
429	Too Many Requests	The expected rate limit is exceeded. Refer here
Error codes
Please find bellow the codes returned in the JSON body in case of an error.

Code	Explanation
invalid_parameter	The value of the parameter you have provided is not valid. Please check the format and the type
missing_parameter	One of the required parameter is missing to perform the request
out_of_range	The value of the parameter you have provided is not included in the authorized range
unauthorized	You are not authorized to do this call
document_not_found	The parameter value in brackets {} is not found
method_not_allowed	The method you are requesting for this path is not allowed. (ex : you are doing put but only get method is allowed for the path
not_enough_credits	You don't have enough credit to perform the request. Example : you are trying to send a campaign but your plan has expired
duplicate_parameter	One of the parameters in the request already exists.
duplicate_request	The request rate of the very same request is too high
account_under_validation	Your account is under validation
permission_denied	You don't have the permission to perform this request
Brevo IP addresses
Some applications might find it handy to know about Brevo IPs. This page is intended to be the definitive source of Brevo current IP ranges. We will add new IPs over time.

📘
You can see here all the IP ranges for Brevo.

🚧
Cloudflare's IPs

Many of our applications are also taking advantage of Cloudflare's proxy. You will have to whitelist their IPs as well. The exhaustive list of Cloudflare's IPs can be found here.

Updated 5 months ago

1. Import the SDK to your project
Run in your project's directory the following command: npm install @getbrevo/brevo --save

Create an example class in your project to try out this recipe, run in your console
touch emailBuilder.js

Done, you have installed the SDK! 👍
2. Import the SDK into the emailBuilder.js class
Now we need to import the SDK into whatever class we use to send emails. For this example we created emailBuilder.js

First, we require the 'sib-api-v3-sdk' module
Next we need to authenticate the app with Brevo, for this we want to copy and paste the v3 api key from your account settings. We will pass that string to the apiKey variable.
For the purpose of this demo simple, we will build the email inside the request statement. But feel free to take that code out and build it in a separate object and the pass it to the sendTransacEmail for execution. 📧
Edit sending parameters
We will now define the sender and recipient variables subject, sender, replyTo, to. 📤

Notice you can also add in these steps variables such as bcc and cc.

Note: You can include in total up to 99 recipients in bcc , cc and to all together.
 Execute the call
You can just copy and paste the exception management from these lines, no worries, it won't break in runtime.

From your terminal run
node emailBuilder.js

Check your console , the response will be an array containing the messageId , this is the identifier to track the status of the message in the Brevo logs or in webhooks.

Check your inbox, your text email should land there soon! 📬
const brevo = require('@getbrevo/brevo');
let defaultClient = brevo.ApiClient.instance;

let apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = 'xkeysib-YOUR_API_KEY';

let apiInstance = new brevo.TransactionalEmailsApi();
let sendSmtpEmail = new brevo.SendSmtpEmail();

sendSmtpEmail.subject = "My {{params.subject}}";
sendSmtpEmail.htmlContent = "<html><body><h1>Common: This is my first transactional email {{params.parameter}}</h1></body></html>";
sendSmtpEmail.sender = { "name": "John", "email": "example@example.com" };
sendSmtpEmail.to = [
  { "email": "example@brevo.com", "name": "sample-name" }
];
sendSmtpEmail.replyTo = { "email": "example@brevo.com", "name": "sample-name" };
sendSmtpEmail.headers = { "Some-Custom-Name": "unique-id-1234" };
sendSmtpEmail.params = { "parameter": "My param value", "subject": "common subject" };


apiInstance.sendTransacEmail(sendSmtpEmail).then(function (data) {
  console.log('API called successfully. Returned data: ' + JSON.stringify(data));
}, function (error) {
  console.error(error);
});

exports {
  messageId: '<202103121308.46570265992@smtp-relay.mailin.fr>'
}

const brevo = require('@getbrevo/brevo');
let defaultClient = brevo.ApiClient.instance;

let apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = 'xkeysib-YOUR_API_KEY';

let apiInstance = new brevo.TransactionalEmailsApi();
let sendSmtpEmail = new brevo.SendSmtpEmail();

sendSmtpEmail.subject = "My {{params.subject}}";
sendSmtpEmail.htmlContent = "<html><body><h1>Common: This is my first transactional email {{params.parameter}}</h1></body></html>";
sendSmtpEmail.sender = { "name": "John", "email": "example@brevo.com" };
sendSmtpEmail.to = [ 
  { "email": "brevo@brevo.com", "name": "John" }
];
sendSmtpEmail.replyTo = { "email": "brevo@brevo.com", "name": "John" };
sendSmtpEmail.headers = { "Some-Custom-Name": "unique-id-1234" };
sendSmtpEmail.params = { "parameter": "My param value", "subject": "common subject" };
sendSmtpEmail.messageVersions = [{
    "to": [
      {
        "email": "brevo@brevo.com",
        "name": "John"
      }
    ],
    "headers": {
      "Message-Id": "<123.123@smtp-relay.mailin.fr>"
    },
    "params": {
      "greeting": "Welcome onboard!",
      "headline": "Be Ready for Takeoff."
    },
    "subject": "+001",
    "htmlContent": "<html><body><h1>+001 content</h1></body></html>"
  },
  {
    "to": [
      {
        "email": "brevo@brevo.com",
        "name": "Steve"
      }
    ],
    "params": {
      "greeting": "Greeting 1.",
      "headline": "Some bathing suits you might like"
    },
    "subject": "+002"
}];

apiInstance.sendTransacEmail(sendSmtpEmail).then(function (data) {
  console.log('API called successfully. Returned data: ' + JSON.stringify(data));
}, function (error) {
  console.error(error);
});
exports {
  messageIds: [
    '<202103141108.83265372843.1@smtp-relay.mailin.fr>',
    '<202103141108.83265372843.2@smtp-relay.mailin.fr>'
  ]
}
exports {
  messageIds: [
    '<202103141108.83265372843.1@smtp-relay.mailin.fr>',
    '<202103141108.83265372843.2@smtp-relay.mailin.fr>'
  ]
}

Code Examples
You can use as reference the code below to implement this call in your preferred language.
Check all our official API clients here

Node.js
PHP
Python
TypeScript
Java
C#
Go
Ruby

const brevo = require('@getbrevo/brevo');
let defaultClient = brevo.ApiClient.instance;

let apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = 'xkeysib-YOUR_API_KEY';

let apiInstance = new brevo.TransactionalEmailsApi();
let sendSmtpEmail = new brevo.SendSmtpEmail();

sendSmtpEmail.subject = "My {{params.subject}}";
sendSmtpEmail.htmlContent = "<html><body><h1>Common: This is my first transactional email {{params.parameter}}</h1></body></html>";
sendSmtpEmail.sender = { "name": "John", "email": "example@example.com" };
sendSmtpEmail.to = [
  { "email": "example@brevo.com", "name": "sample-name" }
];
sendSmtpEmail.replyTo = { "email": "example@brevo.com", "name": "sample-name" };
sendSmtpEmail.headers = { "Some-Custom-Name": "unique-id-1234" };
sendSmtpEmail.params = { "parameter": "My param value", "subject": "common subject" };


apiInstance.sendTransacEmail(sendSmtpEmail).then(function (data) {
  console.log('API called successfully. Returned data: ' + JSON.stringify(data));
}, function (error) {
  console.error(error);
});
Send Transactional Emails in PHP
Open Recipe
Body Params
Values to send a transactional email

sender
object
Mandatory if templateId is not passed. Pass name (optional) and email or id of sender from which emails will be sent. name will be ignored if passed along with sender id. For example,
{"name":"Mary from MyShop", "email":"no-reply@myshop.com"}
{"id":2}


sender object
to
array of objects
Mandatory if messageVersions are not passed, ignored if messageVersions are passed
List of email addresses and names (optional) of the recipients. For example,
[{"name":"Jimmy", "email":"jimmy98@example.com"}, {"name":"Joe", "email":"joe@example.com"}]


ADD object
bcc
array of objects
List of email addresses and names (optional) of the recipients in bcc


ADD object
cc
array of objects
List of email addresses and names (optional) of the recipients in cc


ADD object
htmlContent
string
HTML body of the message. Mandatory if 'templateId' is not passed, ignored if 'templateId' is passed

textContent
string
Plain Text body of the message. Ignored if 'templateId' is passed

subject
string
Subject of the message. Mandatory if 'templateId' is not passed

replyTo
object
Email (required), along with name (optional), on which transactional mail recipients will be able to reply back. For example,
{"email":"ann6533@example.com", "name":"Ann"}


replyTo object
attachment
array of objects
Pass the absolute URL (no local file) or the base64 content of the attachment along with the attachment name. Mandatory if attachment content is passed. For example,
[{"url":"https://attachment.domain.com/myAttachmentFromUrl.jpg", "name":"myAttachmentFromUrl.jpg"}, {"content":"base64 example content", "name":"myAttachmentFromBase64.jpg"}].
Allowed extensions for attachment file:

xlsx, xls, ods, docx, docm, doc, csv, pdf, txt, gif, jpg, jpeg, png, tif, tiff, rtf, bmp, cgm, css, shtml, html, htm, zip, xml, ppt, pptx, tar, ez, ics, mobi, msg, pub, eps, odt, mp3, m4a, m4v, wma, ogg, flac, wav, aif, aifc, aiff, mp4, mov, avi, mkv, mpeg, mpg, wmv, pkpass and xlsm.
If templateId is passed and is in New Template Language format then both attachment url and content are accepted. If template is in Old template Language format, then attachment is ignored


ADD object
headers
object
Pass the set of custom headers (not the standard headers) that shall be sent along the mail headers in the original email. 'sender.ip' header can be set (only for dedicated ip users) to mention the IP to be used for sending transactional emails. Headers are allowed in This-Case-Only (i.e. words separated by hyphen with first letter of each word in capital letter), they will be converted to such case styling if not in this format in the request payload. For example,
{"sender.ip":"1.2.3.4", "X-Mailin-custom":"some_custom_header", "idempotencyKey":"abc-123"}.


headers object
templateId
int64
Id of the template.

params
object
Pass the set of attributes to customize the template. For example, {"FNAME":"Joe", "LNAME":"Doe"}. It's considered only if template is in New Template Language format.


params object
messageVersions
array of objects
You can customize and send out multiple versions of a mail. templateId can be customized only if global parameter contains templateId. htmlContent and textContent can be customized only if any of the two, htmlContent or textContent, is present in global parameters. Some global parameters such as to(mandatory), bcc, cc, replyTo, subject can also be customized specific to each version.
Total number of recipients in one API request must not exceed 2000. However, you can still pass upto 99 recipients maximum in one message version.
The size of individual params in all the messageVersions shall not exceed 100 KB limit and that of cumulative params shall not exceed 1000 KB.
You can follow this step-by-step guide on how to use messageVersions to batch send emails - https://developers.brevo.com/docs/batch-send-transactional-emails


ADD object
tags
array of strings
Tag your emails to find them more easily


ADD string
scheduledAt
date-time
UTC date-time on which the email has to schedule (YYYY-MM-DDTHH:mm:ss.SSSZ). Prefer to pass your timezone in date-time format for scheduling. There can be an expected delay of +5 minutes in scheduled email delivery.

batchId
string
Valid UUIDv4 batch id to identify the scheduled batches transactional email. If not passed we will create a valid UUIDv4 batch id at our end.

Responses

201
transactional email sent


202
transactional email scheduled


400
bad request

Updated about 1 year ago
Create an email template
post
https://api.brevo.com/v3/smtp/templates
Log in to see full request history
time	status	user agent	
Make a request to see history.
0 Requests This Month

Code Examples
You can use as reference the code below to implement this call in your preferred language.
Check all our official API clients here

Node.js
PHP
Python
TypeScript
Java
C#
Go
Ruby

const SibApiV3Sdk = require('sib-api-v3-sdk');
let defaultClient = SibApiV3Sdk.ApiClient.instance;

let apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = 'YOUR API KEY';

let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

let smtpTemplate = new SibApiV3Sdk.CreateSmtpTemplate();

smtpTemplate.sender = {"name":"John Doe","email":"example@example.com"};
smtpTemplate.templateName = "Example Template";
smtpTemplate.htmlContent = "<html><body><h1>This is my first transactional email</h1></body></html>";
smtpTemplate.subject = "New Subject";
smtpTemplate.replyTo = "replyto@domain.com";
smtpTemplate.toField = "example@example.com";
smtpTemplate.isActive = true;
smtpTemplate.attachmentUrl = "https://example.net/upload-file";

apiInstance.createSmtpTemplate(smtpTemplate).then(function(data) {
  console.log('API called successfully. Returned data: ' + JSON.stringify(data));
}, function(error) {
  console.error(error);
});
Body Params
values to update in transactional email template

tag
string
Tag of the template

sender
object
required
Sender details including id or email and name (optional). Only one of either Sender's email or Sender's ID shall be passed in one request at a time. For example:
{"name":"xyz", "email":"example@abc.com"}
{"name":"xyz", "id":123}


sender object
templateName
string
required
Name of the template

htmlContent
string
Body of the message (HTML version). The field must have more than 10 characters. REQUIRED if htmlUrl is empty

htmlUrl
url
Url which contents the body of the email message. REQUIRED if htmlContent is empty

subject
string
required
Subject of the template

replyTo
string
Email on which campaign recipients will be able to reply to

toField
string
To personalize the To Field. If you want to include the first name and last name of your recipient, add {FNAME} {LNAME}. These contact attributes must already exist in your Brevo account. If input parameter params used please use {{contact.FNAME}} {{contact.LNAME}} for personalization

attachmentUrl
url
Absolute url of the attachment (no local file). Extension allowed:

xlsx, xls, ods, docx, docm, doc, csv, pdf, txt, gif, jpg, jpeg, png, tif, tiff, rtf, bmp, cgm, css, shtml, html, htm, zip, xml, ppt, pptx, tar, ez, ics, mobi, msg, pub and eps'
isActive
boolean
Status of template. isActive = true means template is active and isActive = false means template is inactive


Responses

201
successfully created


400
bad request

Updated about 1 year ago

# SendinBlue\Client\TransactionalEmailsApi

All URIs are relative to *https://api.sendinblue.com/v3*

Method | HTTP request | Description
------------- | ------------- | -------------
[**blockNewDomain**](TransactionalEmailsApi.md#blockNewDomain) | **POST** /smtp/blockedDomains | Add a new domain to the list of blocked domains
[**createSmtpTemplate**](TransactionalEmailsApi.md#createSmtpTemplate) | **POST** /smtp/templates | Create an email template
[**deleteBlockedDomain**](TransactionalEmailsApi.md#deleteBlockedDomain) | **DELETE** /smtp/blockedDomains/{domain} | Unblock an existing domain from the list of blocked domains
[**deleteHardbounces**](TransactionalEmailsApi.md#deleteHardbounces) | **POST** /smtp/deleteHardbounces | Delete hardbounces
[**deleteScheduledEmailById**](TransactionalEmailsApi.md#deleteScheduledEmailById) | **DELETE** /smtp/email/{identifier} | Delete scheduled emails by batchId or messageId
[**deleteSmtpTemplate**](TransactionalEmailsApi.md#deleteSmtpTemplate) | **DELETE** /smtp/templates/{templateId} | Delete an inactive email template
[**getAggregatedSmtpReport**](TransactionalEmailsApi.md#getAggregatedSmtpReport) | **GET** /smtp/statistics/aggregatedReport | Get your transactional email activity aggregated over a period of time
[**getBlockedDomains**](TransactionalEmailsApi.md#getBlockedDomains) | **GET** /smtp/blockedDomains | Get the list of blocked domains
[**getEmailEventReport**](TransactionalEmailsApi.md#getEmailEventReport) | **GET** /smtp/statistics/events | Get all your transactional email activity (unaggregated events)
[**getScheduledEmailByBatchId**](TransactionalEmailsApi.md#getScheduledEmailByBatchId) | **GET** /smtp/emailStatus/{batchId} | Fetch scheduled emails by batchId
[**getScheduledEmailByMessageId**](TransactionalEmailsApi.md#getScheduledEmailByMessageId) | **GET** /smtp/emailStatus/{messageId} | Fetch scheduled email by messageId
[**getSmtpReport**](TransactionalEmailsApi.md#getSmtpReport) | **GET** /smtp/statistics/reports | Get your transactional email activity aggregated per day
[**getSmtpTemplate**](TransactionalEmailsApi.md#getSmtpTemplate) | **GET** /smtp/templates/{templateId} | Returns the template information
[**getSmtpTemplates**](TransactionalEmailsApi.md#getSmtpTemplates) | **GET** /smtp/templates | Get the list of email templates
[**getTransacBlockedContacts**](TransactionalEmailsApi.md#getTransacBlockedContacts) | **GET** /smtp/blockedContacts | Get the list of blocked or unsubscribed transactional contacts
[**getTransacEmailContent**](TransactionalEmailsApi.md#getTransacEmailContent) | **GET** /smtp/emails/{uuid} | Get the personalized content of a sent transactional email
[**getTransacEmailsList**](TransactionalEmailsApi.md#getTransacEmailsList) | **GET** /smtp/emails | Get the list of transactional emails on the basis of allowed filters
[**sendTestTemplate**](TransactionalEmailsApi.md#sendTestTemplate) | **POST** /smtp/templates/{templateId}/sendTest | Send a template to your test list
[**sendTransacEmail**](TransactionalEmailsApi.md#sendTransacEmail) | **POST** /smtp/email | Send a transactional email
[**smtpBlockedContactsEmailDelete**](TransactionalEmailsApi.md#smtpBlockedContactsEmailDelete) | **DELETE** /smtp/blockedContacts/{email} | Unblock or resubscribe a transactional contact
[**smtpLogMessageIdDelete**](TransactionalEmailsApi.md#smtpLogMessageIdDelete) | **DELETE** /smtp/log/{messageId} | Delete an SMTP transactional log
[**updateSmtpTemplate**](TransactionalEmailsApi.md#updateSmtpTemplate) | **PUT** /smtp/templates/{templateId} | Update an email template


# **blockNewDomain**
> blockNewDomain($blockDomain)

Add a new domain to the list of blocked domains

Blocks a new domain in order to avoid messages being sent to the same

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$blockDomain = new \SendinBlue\Client\Model\BlockDomain(); // \SendinBlue\Client\Model\BlockDomain | 

try {
    $apiInstance->blockNewDomain($blockDomain);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->blockNewDomain: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **blockDomain** | [**\SendinBlue\Client\Model\BlockDomain**](../Model/BlockDomain.md)|  |

### Return type

void (empty response body)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **createSmtpTemplate**
> \SendinBlue\Client\Model\CreateModel createSmtpTemplate($smtpTemplate)

Create an email template

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$smtpTemplate = new \SendinBlue\Client\Model\CreateSmtpTemplate(); // \SendinBlue\Client\Model\CreateSmtpTemplate | values to update in transactional email template

try {
    $result = $apiInstance->createSmtpTemplate($smtpTemplate);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->createSmtpTemplate: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **smtpTemplate** | [**\SendinBlue\Client\Model\CreateSmtpTemplate**](../Model/CreateSmtpTemplate.md)| values to update in transactional email template |

### Return type

[**\SendinBlue\Client\Model\CreateModel**](../Model/CreateModel.md)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **deleteBlockedDomain**
> deleteBlockedDomain($domain)

Unblock an existing domain from the list of blocked domains

Unblocks an existing domain from the list of blocked domains

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$domain = "domain_example"; // string | The name of the domain to be deleted

try {
    $apiInstance->deleteBlockedDomain($domain);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->deleteBlockedDomain: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **domain** | **string**| The name of the domain to be deleted |

### Return type

void (empty response body)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **deleteHardbounces**
> deleteHardbounces($deleteHardbounces)

Delete hardbounces

Delete hardbounces. To use carefully (e.g. in case of temporary ISP failures)

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$deleteHardbounces = new \SendinBlue\Client\Model\DeleteHardbounces(); // \SendinBlue\Client\Model\DeleteHardbounces | values to delete hardbounces

try {
    $apiInstance->deleteHardbounces($deleteHardbounces);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->deleteHardbounces: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **deleteHardbounces** | [**\SendinBlue\Client\Model\DeleteHardbounces**](../Model/DeleteHardbounces.md)| values to delete hardbounces | [optional]

### Return type

void (empty response body)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **deleteScheduledEmailById**
> deleteScheduledEmailById($identifier)

Delete scheduled emails by batchId or messageId

Delete scheduled batch of emails by batchId or single scheduled email by messageId

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$identifier = "identifier_example"; // string | The `batchId` of scheduled emails batch (Should be a valid UUIDv4) or the `messageId` of scheduled email.

try {
    $apiInstance->deleteScheduledEmailById($identifier);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->deleteScheduledEmailById: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **identifier** | **string**| The &#x60;batchId&#x60; of scheduled emails batch (Should be a valid UUIDv4) or the &#x60;messageId&#x60; of scheduled email. |

### Return type

void (empty response body)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **deleteSmtpTemplate**
> deleteSmtpTemplate($templateId)

Delete an inactive email template

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$templateId = 789; // int | id of the template

try {
    $apiInstance->deleteSmtpTemplate($templateId);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->deleteSmtpTemplate: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **templateId** | **int**| id of the template |

### Return type

void (empty response body)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **getAggregatedSmtpReport**
> \SendinBlue\Client\Model\GetAggregatedReport getAggregatedSmtpReport($startDate, $endDate, $days, $tag)

Get your transactional email activity aggregated over a period of time

This endpoint will show the aggregated stats for past 90 days by default if `startDate` and `endDate` OR `days` is not passed. The date range can not exceed 90 days

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$startDate = "startDate_example"; // string | Mandatory if endDate is used. Starting date of the report (YYYY-MM-DD). Must be lower than equal to endDate
$endDate = "endDate_example"; // string | Mandatory if startDate is used. Ending date of the report (YYYY-MM-DD). Must be greater than equal to startDate
$days = 789; // int | Number of days in the past including today (positive integer). Not compatible with 'startDate' and 'endDate'
$tag = "tag_example"; // string | Tag of the emails

try {
    $result = $apiInstance->getAggregatedSmtpReport($startDate, $endDate, $days, $tag);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->getAggregatedSmtpReport: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **startDate** | **string**| Mandatory if endDate is used. Starting date of the report (YYYY-MM-DD). Must be lower than equal to endDate | [optional]
 **endDate** | **string**| Mandatory if startDate is used. Ending date of the report (YYYY-MM-DD). Must be greater than equal to startDate | [optional]
 **days** | **int**| Number of days in the past including today (positive integer). Not compatible with &#39;startDate&#39; and &#39;endDate&#39; | [optional]
 **tag** | **string**| Tag of the emails | [optional]

### Return type

[**\SendinBlue\Client\Model\GetAggregatedReport**](../Model/GetAggregatedReport.md)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **getBlockedDomains**
> \SendinBlue\Client\Model\GetBlockedDomains getBlockedDomains()

Get the list of blocked domains

Get the list of blocked domains

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);

try {
    $result = $apiInstance->getBlockedDomains();
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->getBlockedDomains: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**\SendinBlue\Client\Model\GetBlockedDomains**](../Model/GetBlockedDomains.md)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **getEmailEventReport**
> \SendinBlue\Client\Model\GetEmailEventReport getEmailEventReport($limit, $offset, $startDate, $endDate, $days, $email, $event, $tags, $messageId, $templateId, $sort)

Get all your transactional email activity (unaggregated events)

This endpoint will show the aggregated stats for past 30 days by default if `startDate` and `endDate` OR `days` is not passed. The date range can not exceed 90 days

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$limit = 2500; // int | Number limitation for the result returned
$offset = 0; // int | Beginning point in the list to retrieve from.
$startDate = "startDate_example"; // string | Mandatory if endDate is used. Starting date of the report (YYYY-MM-DD). Must be lower than equal to endDate
$endDate = "endDate_example"; // string | Mandatory if startDate is used. Ending date of the report (YYYY-MM-DD). Must be greater than equal to startDate
$days = 789; // int | Number of days in the past including today (positive integer). Not compatible with 'startDate' and 'endDate'
$email = "email_example"; // string | Filter the report for a specific email addresses
$event = "event_example"; // string | Filter the report for a specific event type
$tags = "tags_example"; // string | Filter the report for tags (serialized and urlencoded array)
$messageId = "messageId_example"; // string | Filter on a specific message id
$templateId = 789; // int | Filter on a specific template id
$sort = "desc"; // string | Sort the results in the ascending/descending order of record creation. Default order is **descending** if `sort` is not passed

try {
    $result = $apiInstance->getEmailEventReport($limit, $offset, $startDate, $endDate, $days, $email, $event, $tags, $messageId, $templateId, $sort);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->getEmailEventReport: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**| Number limitation for the result returned | [optional] [default to 2500]
 **offset** | **int**| Beginning point in the list to retrieve from. | [optional] [default to 0]
 **startDate** | **string**| Mandatory if endDate is used. Starting date of the report (YYYY-MM-DD). Must be lower than equal to endDate | [optional]
 **endDate** | **string**| Mandatory if startDate is used. Ending date of the report (YYYY-MM-DD). Must be greater than equal to startDate | [optional]
 **days** | **int**| Number of days in the past including today (positive integer). Not compatible with &#39;startDate&#39; and &#39;endDate&#39; | [optional]
 **email** | **string**| Filter the report for a specific email addresses | [optional]
 **event** | **string**| Filter the report for a specific event type | [optional]
 **tags** | **string**| Filter the report for tags (serialized and urlencoded array) | [optional]
 **messageId** | **string**| Filter on a specific message id | [optional]
 **templateId** | **int**| Filter on a specific template id | [optional]
 **sort** | **string**| Sort the results in the ascending/descending order of record creation. Default order is **descending** if &#x60;sort&#x60; is not passed | [optional] [default to desc]

### Return type

[**\SendinBlue\Client\Model\GetEmailEventReport**](../Model/GetEmailEventReport.md)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **getScheduledEmailByBatchId**
> \SendinBlue\Client\Model\GetScheduledEmailByBatchId getScheduledEmailByBatchId($batchId, $startDate, $endDate, $sort, $status, $limit, $offset)

Fetch scheduled emails by batchId

Fetch scheduled batch of emails by batchId (Can retrieve data upto 30 days old)

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$batchId = "batchId_example"; // string | The batchId of scheduled emails batch (Should be a valid UUIDv4)
$startDate = new \DateTime("2013-10-20"); // \DateTime | Mandatory if `endDate` is used. Starting date (YYYY-MM-DD) from which you want to fetch the list. Can be maximum 30 days older tha current date.
$endDate = new \DateTime("2013-10-20"); // \DateTime | Mandatory if `startDate` is used. Ending date (YYYY-MM-DD) till which you want to fetch the list. Maximum time period that can be selected is one month.
$sort = "desc"; // string | Sort the results in the ascending/descending order of record creation. Default order is **descending** if `sort` is not passed
$status = "status_example"; // string | Filter the records by `status` of the scheduled email batch or message.
$limit = 100; // int | Number of documents returned per page
$offset = 0; // int | Index of the first document on the page

try {
    $result = $apiInstance->getScheduledEmailByBatchId($batchId, $startDate, $endDate, $sort, $status, $limit, $offset);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->getScheduledEmailByBatchId: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **batchId** | **string**| The batchId of scheduled emails batch (Should be a valid UUIDv4) |
 **startDate** | **\DateTime**| Mandatory if &#x60;endDate&#x60; is used. Starting date (YYYY-MM-DD) from which you want to fetch the list. Can be maximum 30 days older tha current date. | [optional]
 **endDate** | **\DateTime**| Mandatory if &#x60;startDate&#x60; is used. Ending date (YYYY-MM-DD) till which you want to fetch the list. Maximum time period that can be selected is one month. | [optional]
 **sort** | **string**| Sort the results in the ascending/descending order of record creation. Default order is **descending** if &#x60;sort&#x60; is not passed | [optional] [default to desc]
 **status** | **string**| Filter the records by &#x60;status&#x60; of the scheduled email batch or message. | [optional]
 **limit** | **int**| Number of documents returned per page | [optional] [default to 100]
 **offset** | **int**| Index of the first document on the page | [optional] [default to 0]

### Return type

[**\SendinBlue\Client\Model\GetScheduledEmailByBatchId**](../Model/GetScheduledEmailByBatchId.md)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **getScheduledEmailByMessageId**
> \SendinBlue\Client\Model\GetScheduledEmailByMessageId getScheduledEmailByMessageId($messageId, $startDate, $endDate)

Fetch scheduled email by messageId

Fetch scheduled email by messageId (Can retrieve data upto 30 days old)

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$messageId = "messageId_example"; // string | The messageId of scheduled email
$startDate = new \DateTime("2013-10-20"); // \DateTime | Mandatory if endDate is used. Starting date (YYYY-MM-DD) from which you want to fetch the list. Can be maximum 30 days older tha current date.
$endDate = new \DateTime("2013-10-20"); // \DateTime | Mandatory if startDate is used. Ending date (YYYY-MM-DD) till which you want to fetch the list. Maximum time period that can be selected is one month.

try {
    $result = $apiInstance->getScheduledEmailByMessageId($messageId, $startDate, $endDate);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->getScheduledEmailByMessageId: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **messageId** | **string**| The messageId of scheduled email |
 **startDate** | **\DateTime**| Mandatory if endDate is used. Starting date (YYYY-MM-DD) from which you want to fetch the list. Can be maximum 30 days older tha current date. | [optional]
 **endDate** | **\DateTime**| Mandatory if startDate is used. Ending date (YYYY-MM-DD) till which you want to fetch the list. Maximum time period that can be selected is one month. | [optional]

### Return type

[**\SendinBlue\Client\Model\GetScheduledEmailByMessageId**](../Model/GetScheduledEmailByMessageId.md)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **getSmtpReport**
> \SendinBlue\Client\Model\GetReports getSmtpReport($limit, $offset, $startDate, $endDate, $days, $tag, $sort)

Get your transactional email activity aggregated per day

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$limit = 10; // int | Number of documents returned per page
$offset = 0; // int | Index of the first document on the page
$startDate = "startDate_example"; // string | Mandatory if endDate is used. Starting date of the report (YYYY-MM-DD)
$endDate = "endDate_example"; // string | Mandatory if startDate is used. Ending date of the report (YYYY-MM-DD)
$days = 789; // int | Number of days in the past including today (positive integer). Not compatible with 'startDate' and 'endDate'
$tag = "tag_example"; // string | Tag of the emails
$sort = "desc"; // string | Sort the results in the ascending/descending order of record creation. Default order is **descending** if `sort` is not passed

try {
    $result = $apiInstance->getSmtpReport($limit, $offset, $startDate, $endDate, $days, $tag, $sort);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->getSmtpReport: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**| Number of documents returned per page | [optional] [default to 10]
 **offset** | **int**| Index of the first document on the page | [optional] [default to 0]
 **startDate** | **string**| Mandatory if endDate is used. Starting date of the report (YYYY-MM-DD) | [optional]
 **endDate** | **string**| Mandatory if startDate is used. Ending date of the report (YYYY-MM-DD) | [optional]
 **days** | **int**| Number of days in the past including today (positive integer). Not compatible with &#39;startDate&#39; and &#39;endDate&#39; | [optional]
 **tag** | **string**| Tag of the emails | [optional]
 **sort** | **string**| Sort the results in the ascending/descending order of record creation. Default order is **descending** if &#x60;sort&#x60; is not passed | [optional] [default to desc]

### Return type

[**\SendinBlue\Client\Model\GetReports**](../Model/GetReports.md)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **getSmtpTemplate**
> \SendinBlue\Client\Model\GetSmtpTemplateOverview getSmtpTemplate($templateId)

Returns the template information

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$templateId = 789; // int | id of the template

try {
    $result = $apiInstance->getSmtpTemplate($templateId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->getSmtpTemplate: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **templateId** | **int**| id of the template |

### Return type

[**\SendinBlue\Client\Model\GetSmtpTemplateOverview**](../Model/GetSmtpTemplateOverview.md)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **getSmtpTemplates**
> \SendinBlue\Client\Model\GetSmtpTemplates getSmtpTemplates($templateStatus, $limit, $offset, $sort)

Get the list of email templates

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$templateStatus = true; // bool | Filter on the status of the template. Active = true, inactive = false
$limit = 50; // int | Number of documents returned per page
$offset = 0; // int | Index of the first document in the page
$sort = "desc"; // string | Sort the results in the ascending/descending order of record creation. Default order is **descending** if `sort` is not passed

try {
    $result = $apiInstance->getSmtpTemplates($templateStatus, $limit, $offset, $sort);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->getSmtpTemplates: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **templateStatus** | **bool**| Filter on the status of the template. Active &#x3D; true, inactive &#x3D; false | [optional]
 **limit** | **int**| Number of documents returned per page | [optional] [default to 50]
 **offset** | **int**| Index of the first document in the page | [optional] [default to 0]
 **sort** | **string**| Sort the results in the ascending/descending order of record creation. Default order is **descending** if &#x60;sort&#x60; is not passed | [optional] [default to desc]

### Return type

[**\SendinBlue\Client\Model\GetSmtpTemplates**](../Model/GetSmtpTemplates.md)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **getTransacBlockedContacts**
> \SendinBlue\Client\Model\GetTransacBlockedContacts getTransacBlockedContacts($startDate, $endDate, $limit, $offset, $senders, $sort)

Get the list of blocked or unsubscribed transactional contacts

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$startDate = "startDate_example"; // string | Mandatory if endDate is used. Starting date (YYYY-MM-DD) from which you want to fetch the blocked or unsubscribed contacts
$endDate = "endDate_example"; // string | Mandatory if startDate is used. Ending date (YYYY-MM-DD) till which you want to fetch the blocked or unsubscribed contacts
$limit = 50; // int | Number of documents returned per page
$offset = 0; // int | Index of the first document on the page
$senders = array("senders_example"); // string[] | Comma separated list of emails of the senders from which contacts are blocked or unsubscribed
$sort = "desc"; // string | Sort the results in the ascending/descending order of record creation. Default order is **descending** if `sort` is not passed

try {
    $result = $apiInstance->getTransacBlockedContacts($startDate, $endDate, $limit, $offset, $senders, $sort);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->getTransacBlockedContacts: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **startDate** | **string**| Mandatory if endDate is used. Starting date (YYYY-MM-DD) from which you want to fetch the blocked or unsubscribed contacts | [optional]
 **endDate** | **string**| Mandatory if startDate is used. Ending date (YYYY-MM-DD) till which you want to fetch the blocked or unsubscribed contacts | [optional]
 **limit** | **int**| Number of documents returned per page | [optional] [default to 50]
 **offset** | **int**| Index of the first document on the page | [optional] [default to 0]
 **senders** | [**string[]**](../Model/string.md)| Comma separated list of emails of the senders from which contacts are blocked or unsubscribed | [optional]
 **sort** | **string**| Sort the results in the ascending/descending order of record creation. Default order is **descending** if &#x60;sort&#x60; is not passed | [optional] [default to desc]

### Return type

[**\SendinBlue\Client\Model\GetTransacBlockedContacts**](../Model/GetTransacBlockedContacts.md)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **getTransacEmailContent**
> \SendinBlue\Client\Model\GetTransacEmailContent getTransacEmailContent($uuid)

Get the personalized content of a sent transactional email

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$uuid = "uuid_example"; // string | Unique id of the transactional email that has been sent to a particular contact

try {
    $result = $apiInstance->getTransacEmailContent($uuid);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->getTransacEmailContent: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **uuid** | **string**| Unique id of the transactional email that has been sent to a particular contact |

### Return type

[**\SendinBlue\Client\Model\GetTransacEmailContent**](../Model/GetTransacEmailContent.md)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **getTransacEmailsList**
> \SendinBlue\Client\Model\GetTransacEmailsList getTransacEmailsList($email, $templateId, $messageId, $startDate, $endDate, $sort, $limit, $offset)

Get the list of transactional emails on the basis of allowed filters

This endpoint will show the list of emails for past 30 days by default. To retrieve emails before that time, please pass startDate and endDate in query filters.

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$email = "email_example"; // string | Mandatory if templateId and messageId are not passed in query filters. Email address to which transactional email has been sent.
$templateId = 789; // int | Mandatory if email and messageId are not passed in query filters. Id of the template that was used to compose transactional email.
$messageId = "messageId_example"; // string | Mandatory if templateId and email are not passed in query filters. Message ID of the transactional email sent.
$startDate = "startDate_example"; // string | Mandatory if endDate is used. Starting date (YYYY-MM-DD) from which you want to fetch the list. Maximum time period that can be selected is one month.
$endDate = "endDate_example"; // string | Mandatory if startDate is used. Ending date (YYYY-MM-DD) till which you want to fetch the list. Maximum time period that can be selected is one month.
$sort = "desc"; // string | Sort the results in the ascending/descending order of record creation. Default order is **descending** if `sort` is not passed
$limit = 500; // int | Number of documents returned per page
$offset = 0; // int | Index of the first document in the page

try {
    $result = $apiInstance->getTransacEmailsList($email, $templateId, $messageId, $startDate, $endDate, $sort, $limit, $offset);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->getTransacEmailsList: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **email** | **string**| Mandatory if templateId and messageId are not passed in query filters. Email address to which transactional email has been sent. | [optional]
 **templateId** | **int**| Mandatory if email and messageId are not passed in query filters. Id of the template that was used to compose transactional email. | [optional]
 **messageId** | **string**| Mandatory if templateId and email are not passed in query filters. Message ID of the transactional email sent. | [optional]
 **startDate** | **string**| Mandatory if endDate is used. Starting date (YYYY-MM-DD) from which you want to fetch the list. Maximum time period that can be selected is one month. | [optional]
 **endDate** | **string**| Mandatory if startDate is used. Ending date (YYYY-MM-DD) till which you want to fetch the list. Maximum time period that can be selected is one month. | [optional]
 **sort** | **string**| Sort the results in the ascending/descending order of record creation. Default order is **descending** if &#x60;sort&#x60; is not passed | [optional] [default to desc]
 **limit** | **int**| Number of documents returned per page | [optional] [default to 500]
 **offset** | **int**| Index of the first document in the page | [optional] [default to 0]

### Return type

[**\SendinBlue\Client\Model\GetTransacEmailsList**](../Model/GetTransacEmailsList.md)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **sendTestTemplate**
> sendTestTemplate($templateId, $sendTestEmail)

Send a template to your test list

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$templateId = 789; // int | Id of the template
$sendTestEmail = new \SendinBlue\Client\Model\SendTestEmail(); // \SendinBlue\Client\Model\SendTestEmail | 

try {
    $apiInstance->sendTestTemplate($templateId, $sendTestEmail);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->sendTestTemplate: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **templateId** | **int**| Id of the template |
 **sendTestEmail** | [**\SendinBlue\Client\Model\SendTestEmail**](../Model/SendTestEmail.md)|  |

### Return type

void (empty response body)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **sendTransacEmail**
> \SendinBlue\Client\Model\CreateSmtpEmail sendTransacEmail($sendSmtpEmail)

Send a transactional email

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$sendSmtpEmail = new \SendinBlue\Client\Model\SendSmtpEmail(); // \SendinBlue\Client\Model\SendSmtpEmail | Values to send a transactional email

try {
    $result = $apiInstance->sendTransacEmail($sendSmtpEmail);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->sendTransacEmail: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **sendSmtpEmail** | [**\SendinBlue\Client\Model\SendSmtpEmail**](../Model/SendSmtpEmail.md)| Values to send a transactional email |

### Return type

[**\SendinBlue\Client\Model\CreateSmtpEmail**](../Model/CreateSmtpEmail.md)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **smtpBlockedContactsEmailDelete**
> smtpBlockedContactsEmailDelete($email)

Unblock or resubscribe a transactional contact

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$email = "email_example"; // string | contact email (urlencoded) to unblock.

try {
    $apiInstance->smtpBlockedContactsEmailDelete($email);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->smtpBlockedContactsEmailDelete: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **email** | **string**| contact email (urlencoded) to unblock. |

### Return type

void (empty response body)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **smtpLogMessageIdDelete**
> smtpLogMessageIdDelete($messageId)

Delete an SMTP transactional log

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$messageId = "messageId_example"; // string | MessageId of the transactional log to delete

try {
    $apiInstance->smtpLogMessageIdDelete($messageId);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->smtpLogMessageIdDelete: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **messageId** | **string**| MessageId of the transactional log to delete |

### Return type

void (empty response body)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **updateSmtpTemplate**
> updateSmtpTemplate($templateId, $smtpTemplate)

Update an email template

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$templateId = 789; // int | id of the template
$smtpTemplate = new \SendinBlue\Client\Model\UpdateSmtpTemplate(); // \SendinBlue\Client\Model\UpdateSmtpTemplate | values to update in transactional email template

try {
    $apiInstance->updateSmtpTemplate($templateId, $smtpTemplate);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->updateSmtpTemplate: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **templateId** | **int**| id of the template |
 **smtpTemplate** | [**\SendinBlue\Client\Model\UpdateSmtpTemplate**](../Model/UpdateSmtpTemplate.md)| values to update in transactional email template |

### Return type

void (empty response body)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# SendinBlue\Client\TransactionalEmailsApi

All URIs are relative to *https://api.sendinblue.com/v3*

Method | HTTP request | Description
------------- | ------------- | -------------
[**blockNewDomain**](TransactionalEmailsApi.md#blockNewDomain) | **POST** /smtp/blockedDomains | Add a new domain to the list of blocked domains
[**createSmtpTemplate**](TransactionalEmailsApi.md#createSmtpTemplate) | **POST** /smtp/templates | Create an email template
[**deleteBlockedDomain**](TransactionalEmailsApi.md#deleteBlockedDomain) | **DELETE** /smtp/blockedDomains/{domain} | Unblock an existing domain from the list of blocked domains
[**deleteHardbounces**](TransactionalEmailsApi.md#deleteHardbounces) | **POST** /smtp/deleteHardbounces | Delete hardbounces
[**deleteScheduledEmailById**](TransactionalEmailsApi.md#deleteScheduledEmailById) | **DELETE** /smtp/email/{identifier} | Delete scheduled emails by batchId or messageId
[**deleteSmtpTemplate**](TransactionalEmailsApi.md#deleteSmtpTemplate) | **DELETE** /smtp/templates/{templateId} | Delete an inactive email template
[**getAggregatedSmtpReport**](TransactionalEmailsApi.md#getAggregatedSmtpReport) | **GET** /smtp/statistics/aggregatedReport | Get your transactional email activity aggregated over a period of time
[**getBlockedDomains**](TransactionalEmailsApi.md#getBlockedDomains) | **GET** /smtp/blockedDomains | Get the list of blocked domains
[**getEmailEventReport**](TransactionalEmailsApi.md#getEmailEventReport) | **GET** /smtp/statistics/events | Get all your transactional email activity (unaggregated events)
[**getScheduledEmailByBatchId**](TransactionalEmailsApi.md#getScheduledEmailByBatchId) | **GET** /smtp/emailStatus/{batchId} | Fetch scheduled emails by batchId
[**getScheduledEmailByMessageId**](TransactionalEmailsApi.md#getScheduledEmailByMessageId) | **GET** /smtp/emailStatus/{messageId} | Fetch scheduled email by messageId
[**getSmtpReport**](TransactionalEmailsApi.md#getSmtpReport) | **GET** /smtp/statistics/reports | Get your transactional email activity aggregated per day
[**getSmtpTemplate**](TransactionalEmailsApi.md#getSmtpTemplate) | **GET** /smtp/templates/{templateId} | Returns the template information
[**getSmtpTemplates**](TransactionalEmailsApi.md#getSmtpTemplates) | **GET** /smtp/templates | Get the list of email templates
[**getTransacBlockedContacts**](TransactionalEmailsApi.md#getTransacBlockedContacts) | **GET** /smtp/blockedContacts | Get the list of blocked or unsubscribed transactional contacts
[**getTransacEmailContent**](TransactionalEmailsApi.md#getTransacEmailContent) | **GET** /smtp/emails/{uuid} | Get the personalized content of a sent transactional email
[**getTransacEmailsList**](TransactionalEmailsApi.md#getTransacEmailsList) | **GET** /smtp/emails | Get the list of transactional emails on the basis of allowed filters
[**sendTestTemplate**](TransactionalEmailsApi.md#sendTestTemplate) | **POST** /smtp/templates/{templateId}/sendTest | Send a template to your test list
[**sendTransacEmail**](TransactionalEmailsApi.md#sendTransacEmail) | **POST** /smtp/email | Send a transactional email
[**smtpBlockedContactsEmailDelete**](TransactionalEmailsApi.md#smtpBlockedContactsEmailDelete) | **DELETE** /smtp/blockedContacts/{email} | Unblock or resubscribe a transactional contact
[**smtpLogMessageIdDelete**](TransactionalEmailsApi.md#smtpLogMessageIdDelete) | **DELETE** /smtp/log/{messageId} | Delete an SMTP transactional log
[**updateSmtpTemplate**](TransactionalEmailsApi.md#updateSmtpTemplate) | **PUT** /smtp/templates/{templateId} | Update an email template


# **blockNewDomain**
> blockNewDomain($blockDomain)

Add a new domain to the list of blocked domains

Blocks a new domain in order to avoid messages being sent to the same

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$blockDomain = new \SendinBlue\Client\Model\BlockDomain(); // \SendinBlue\Client\Model\BlockDomain | 

try {
    $apiInstance->blockNewDomain($blockDomain);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->blockNewDomain: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **blockDomain** | [**\SendinBlue\Client\Model\BlockDomain**](../Model/BlockDomain.md)|  |

### Return type

void (empty response body)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **createSmtpTemplate**
> \SendinBlue\Client\Model\CreateModel createSmtpTemplate($smtpTemplate)

Create an email template

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$smtpTemplate = new \SendinBlue\Client\Model\CreateSmtpTemplate(); // \SendinBlue\Client\Model\CreateSmtpTemplate | values to update in transactional email template

try {
    $result = $apiInstance->createSmtpTemplate($smtpTemplate);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->createSmtpTemplate: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **smtpTemplate** | [**\SendinBlue\Client\Model\CreateSmtpTemplate**](../Model/CreateSmtpTemplate.md)| values to update in transactional email template |

### Return type

[**\SendinBlue\Client\Model\CreateModel**](../Model/CreateModel.md)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **deleteBlockedDomain**
> deleteBlockedDomain($domain)

Unblock an existing domain from the list of blocked domains

Unblocks an existing domain from the list of blocked domains

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$domain = "domain_example"; // string | The name of the domain to be deleted

try {
    $apiInstance->deleteBlockedDomain($domain);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->deleteBlockedDomain: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **domain** | **string**| The name of the domain to be deleted |

### Return type

void (empty response body)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **deleteHardbounces**
> deleteHardbounces($deleteHardbounces)

Delete hardbounces

Delete hardbounces. To use carefully (e.g. in case of temporary ISP failures)

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$deleteHardbounces = new \SendinBlue\Client\Model\DeleteHardbounces(); // \SendinBlue\Client\Model\DeleteHardbounces | values to delete hardbounces

try {
    $apiInstance->deleteHardbounces($deleteHardbounces);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->deleteHardbounces: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **deleteHardbounces** | [**\SendinBlue\Client\Model\DeleteHardbounces**](../Model/DeleteHardbounces.md)| values to delete hardbounces | [optional]

### Return type

void (empty response body)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **deleteScheduledEmailById**
> deleteScheduledEmailById($identifier)

Delete scheduled emails by batchId or messageId

Delete scheduled batch of emails by batchId or single scheduled email by messageId

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$identifier = "identifier_example"; // string | The `batchId` of scheduled emails batch (Should be a valid UUIDv4) or the `messageId` of scheduled email.

try {
    $apiInstance->deleteScheduledEmailById($identifier);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->deleteScheduledEmailById: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **identifier** | **string**| The &#x60;batchId&#x60; of scheduled emails batch (Should be a valid UUIDv4) or the &#x60;messageId&#x60; of scheduled email. |

### Return type

void (empty response body)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **deleteSmtpTemplate**
> deleteSmtpTemplate($templateId)

Delete an inactive email template

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$templateId = 789; // int | id of the template

try {
    $apiInstance->deleteSmtpTemplate($templateId);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->deleteSmtpTemplate: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **templateId** | **int**| id of the template |

### Return type

void (empty response body)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **getAggregatedSmtpReport**
> \SendinBlue\Client\Model\GetAggregatedReport getAggregatedSmtpReport($startDate, $endDate, $days, $tag)

Get your transactional email activity aggregated over a period of time

This endpoint will show the aggregated stats for past 90 days by default if `startDate` and `endDate` OR `days` is not passed. The date range can not exceed 90 days

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$startDate = "startDate_example"; // string | Mandatory if endDate is used. Starting date of the report (YYYY-MM-DD). Must be lower than equal to endDate
$endDate = "endDate_example"; // string | Mandatory if startDate is used. Ending date of the report (YYYY-MM-DD). Must be greater than equal to startDate
$days = 789; // int | Number of days in the past including today (positive integer). Not compatible with 'startDate' and 'endDate'
$tag = "tag_example"; // string | Tag of the emails

try {
    $result = $apiInstance->getAggregatedSmtpReport($startDate, $endDate, $days, $tag);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->getAggregatedSmtpReport: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **startDate** | **string**| Mandatory if endDate is used. Starting date of the report (YYYY-MM-DD). Must be lower than equal to endDate | [optional]
 **endDate** | **string**| Mandatory if startDate is used. Ending date of the report (YYYY-MM-DD). Must be greater than equal to startDate | [optional]
 **days** | **int**| Number of days in the past including today (positive integer). Not compatible with &#39;startDate&#39; and &#39;endDate&#39; | [optional]
 **tag** | **string**| Tag of the emails | [optional]

### Return type

[**\SendinBlue\Client\Model\GetAggregatedReport**](../Model/GetAggregatedReport.md)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **getBlockedDomains**
> \SendinBlue\Client\Model\GetBlockedDomains getBlockedDomains()

Get the list of blocked domains

Get the list of blocked domains

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);

try {
    $result = $apiInstance->getBlockedDomains();
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->getBlockedDomains: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**\SendinBlue\Client\Model\GetBlockedDomains**](../Model/GetBlockedDomains.md)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **getEmailEventReport**
> \SendinBlue\Client\Model\GetEmailEventReport getEmailEventReport($limit, $offset, $startDate, $endDate, $days, $email, $event, $tags, $messageId, $templateId, $sort)

Get all your transactional email activity (unaggregated events)

This endpoint will show the aggregated stats for past 30 days by default if `startDate` and `endDate` OR `days` is not passed. The date range can not exceed 90 days

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$limit = 2500; // int | Number limitation for the result returned
$offset = 0; // int | Beginning point in the list to retrieve from.
$startDate = "startDate_example"; // string | Mandatory if endDate is used. Starting date of the report (YYYY-MM-DD). Must be lower than equal to endDate
$endDate = "endDate_example"; // string | Mandatory if startDate is used. Ending date of the report (YYYY-MM-DD). Must be greater than equal to startDate
$days = 789; // int | Number of days in the past including today (positive integer). Not compatible with 'startDate' and 'endDate'
$email = "email_example"; // string | Filter the report for a specific email addresses
$event = "event_example"; // string | Filter the report for a specific event type
$tags = "tags_example"; // string | Filter the report for tags (serialized and urlencoded array)
$messageId = "messageId_example"; // string | Filter on a specific message id
$templateId = 789; // int | Filter on a specific template id
$sort = "desc"; // string | Sort the results in the ascending/descending order of record creation. Default order is **descending** if `sort` is not passed

try {
    $result = $apiInstance->getEmailEventReport($limit, $offset, $startDate, $endDate, $days, $email, $event, $tags, $messageId, $templateId, $sort);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->getEmailEventReport: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**| Number limitation for the result returned | [optional] [default to 2500]
 **offset** | **int**| Beginning point in the list to retrieve from. | [optional] [default to 0]
 **startDate** | **string**| Mandatory if endDate is used. Starting date of the report (YYYY-MM-DD). Must be lower than equal to endDate | [optional]
 **endDate** | **string**| Mandatory if startDate is used. Ending date of the report (YYYY-MM-DD). Must be greater than equal to startDate | [optional]
 **days** | **int**| Number of days in the past including today (positive integer). Not compatible with &#39;startDate&#39; and &#39;endDate&#39; | [optional]
 **email** | **string**| Filter the report for a specific email addresses | [optional]
 **event** | **string**| Filter the report for a specific event type | [optional]
 **tags** | **string**| Filter the report for tags (serialized and urlencoded array) | [optional]
 **messageId** | **string**| Filter on a specific message id | [optional]
 **templateId** | **int**| Filter on a specific template id | [optional]
 **sort** | **string**| Sort the results in the ascending/descending order of record creation. Default order is **descending** if &#x60;sort&#x60; is not passed | [optional] [default to desc]

### Return type

[**\SendinBlue\Client\Model\GetEmailEventReport**](../Model/GetEmailEventReport.md)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **getScheduledEmailByBatchId**
> \SendinBlue\Client\Model\GetScheduledEmailByBatchId getScheduledEmailByBatchId($batchId, $startDate, $endDate, $sort, $status, $limit, $offset)

Fetch scheduled emails by batchId

Fetch scheduled batch of emails by batchId (Can retrieve data upto 30 days old)

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$batchId = "batchId_example"; // string | The batchId of scheduled emails batch (Should be a valid UUIDv4)
$startDate = new \DateTime("2013-10-20"); // \DateTime | Mandatory if `endDate` is used. Starting date (YYYY-MM-DD) from which you want to fetch the list. Can be maximum 30 days older tha current date.
$endDate = new \DateTime("2013-10-20"); // \DateTime | Mandatory if `startDate` is used. Ending date (YYYY-MM-DD) till which you want to fetch the list. Maximum time period that can be selected is one month.
$sort = "desc"; // string | Sort the results in the ascending/descending order of record creation. Default order is **descending** if `sort` is not passed
$status = "status_example"; // string | Filter the records by `status` of the scheduled email batch or message.
$limit = 100; // int | Number of documents returned per page
$offset = 0; // int | Index of the first document on the page

try {
    $result = $apiInstance->getScheduledEmailByBatchId($batchId, $startDate, $endDate, $sort, $status, $limit, $offset);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->getScheduledEmailByBatchId: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **batchId** | **string**| The batchId of scheduled emails batch (Should be a valid UUIDv4) |
 **startDate** | **\DateTime**| Mandatory if &#x60;endDate&#x60; is used. Starting date (YYYY-MM-DD) from which you want to fetch the list. Can be maximum 30 days older tha current date. | [optional]
 **endDate** | **\DateTime**| Mandatory if &#x60;startDate&#x60; is used. Ending date (YYYY-MM-DD) till which you want to fetch the list. Maximum time period that can be selected is one month. | [optional]
 **sort** | **string**| Sort the results in the ascending/descending order of record creation. Default order is **descending** if &#x60;sort&#x60; is not passed | [optional] [default to desc]
 **status** | **string**| Filter the records by &#x60;status&#x60; of the scheduled email batch or message. | [optional]
 **limit** | **int**| Number of documents returned per page | [optional] [default to 100]
 **offset** | **int**| Index of the first document on the page | [optional] [default to 0]

### Return type

[**\SendinBlue\Client\Model\GetScheduledEmailByBatchId**](../Model/GetScheduledEmailByBatchId.md)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **getScheduledEmailByMessageId**
> \SendinBlue\Client\Model\GetScheduledEmailByMessageId getScheduledEmailByMessageId($messageId, $startDate, $endDate)

Fetch scheduled email by messageId

Fetch scheduled email by messageId (Can retrieve data upto 30 days old)

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$messageId = "messageId_example"; // string | The messageId of scheduled email
$startDate = new \DateTime("2013-10-20"); // \DateTime | Mandatory if endDate is used. Starting date (YYYY-MM-DD) from which you want to fetch the list. Can be maximum 30 days older tha current date.
$endDate = new \DateTime("2013-10-20"); // \DateTime | Mandatory if startDate is used. Ending date (YYYY-MM-DD) till which you want to fetch the list. Maximum time period that can be selected is one month.

try {
    $result = $apiInstance->getScheduledEmailByMessageId($messageId, $startDate, $endDate);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->getScheduledEmailByMessageId: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **messageId** | **string**| The messageId of scheduled email |
 **startDate** | **\DateTime**| Mandatory if endDate is used. Starting date (YYYY-MM-DD) from which you want to fetch the list. Can be maximum 30 days older tha current date. | [optional]
 **endDate** | **\DateTime**| Mandatory if startDate is used. Ending date (YYYY-MM-DD) till which you want to fetch the list. Maximum time period that can be selected is one month. | [optional]

### Return type

[**\SendinBlue\Client\Model\GetScheduledEmailByMessageId**](../Model/GetScheduledEmailByMessageId.md)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **getSmtpReport**
> \SendinBlue\Client\Model\GetReports getSmtpReport($limit, $offset, $startDate, $endDate, $days, $tag, $sort)

Get your transactional email activity aggregated per day

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$limit = 10; // int | Number of documents returned per page
$offset = 0; // int | Index of the first document on the page
$startDate = "startDate_example"; // string | Mandatory if endDate is used. Starting date of the report (YYYY-MM-DD)
$endDate = "endDate_example"; // string | Mandatory if startDate is used. Ending date of the report (YYYY-MM-DD)
$days = 789; // int | Number of days in the past including today (positive integer). Not compatible with 'startDate' and 'endDate'
$tag = "tag_example"; // string | Tag of the emails
$sort = "desc"; // string | Sort the results in the ascending/descending order of record creation. Default order is **descending** if `sort` is not passed

try {
    $result = $apiInstance->getSmtpReport($limit, $offset, $startDate, $endDate, $days, $tag, $sort);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->getSmtpReport: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**| Number of documents returned per page | [optional] [default to 10]
 **offset** | **int**| Index of the first document on the page | [optional] [default to 0]
 **startDate** | **string**| Mandatory if endDate is used. Starting date of the report (YYYY-MM-DD) | [optional]
 **endDate** | **string**| Mandatory if startDate is used. Ending date of the report (YYYY-MM-DD) | [optional]
 **days** | **int**| Number of days in the past including today (positive integer). Not compatible with &#39;startDate&#39; and &#39;endDate&#39; | [optional]
 **tag** | **string**| Tag of the emails | [optional]
 **sort** | **string**| Sort the results in the ascending/descending order of record creation. Default order is **descending** if &#x60;sort&#x60; is not passed | [optional] [default to desc]

### Return type

[**\SendinBlue\Client\Model\GetReports**](../Model/GetReports.md)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **getSmtpTemplate**
> \SendinBlue\Client\Model\GetSmtpTemplateOverview getSmtpTemplate($templateId)

Returns the template information

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$templateId = 789; // int | id of the template

try {
    $result = $apiInstance->getSmtpTemplate($templateId);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->getSmtpTemplate: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **templateId** | **int**| id of the template |

### Return type

[**\SendinBlue\Client\Model\GetSmtpTemplateOverview**](../Model/GetSmtpTemplateOverview.md)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **getSmtpTemplates**
> \SendinBlue\Client\Model\GetSmtpTemplates getSmtpTemplates($templateStatus, $limit, $offset, $sort)

Get the list of email templates

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$templateStatus = true; // bool | Filter on the status of the template. Active = true, inactive = false
$limit = 50; // int | Number of documents returned per page
$offset = 0; // int | Index of the first document in the page
$sort = "desc"; // string | Sort the results in the ascending/descending order of record creation. Default order is **descending** if `sort` is not passed

try {
    $result = $apiInstance->getSmtpTemplates($templateStatus, $limit, $offset, $sort);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->getSmtpTemplates: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **templateStatus** | **bool**| Filter on the status of the template. Active &#x3D; true, inactive &#x3D; false | [optional]
 **limit** | **int**| Number of documents returned per page | [optional] [default to 50]
 **offset** | **int**| Index of the first document in the page | [optional] [default to 0]
 **sort** | **string**| Sort the results in the ascending/descending order of record creation. Default order is **descending** if &#x60;sort&#x60; is not passed | [optional] [default to desc]

### Return type

[**\SendinBlue\Client\Model\GetSmtpTemplates**](../Model/GetSmtpTemplates.md)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **getTransacBlockedContacts**
> \SendinBlue\Client\Model\GetTransacBlockedContacts getTransacBlockedContacts($startDate, $endDate, $limit, $offset, $senders, $sort)

Get the list of blocked or unsubscribed transactional contacts

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$startDate = "startDate_example"; // string | Mandatory if endDate is used. Starting date (YYYY-MM-DD) from which you want to fetch the blocked or unsubscribed contacts
$endDate = "endDate_example"; // string | Mandatory if startDate is used. Ending date (YYYY-MM-DD) till which you want to fetch the blocked or unsubscribed contacts
$limit = 50; // int | Number of documents returned per page
$offset = 0; // int | Index of the first document on the page
$senders = array("senders_example"); // string[] | Comma separated list of emails of the senders from which contacts are blocked or unsubscribed
$sort = "desc"; // string | Sort the results in the ascending/descending order of record creation. Default order is **descending** if `sort` is not passed

try {
    $result = $apiInstance->getTransacBlockedContacts($startDate, $endDate, $limit, $offset, $senders, $sort);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->getTransacBlockedContacts: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **startDate** | **string**| Mandatory if endDate is used. Starting date (YYYY-MM-DD) from which you want to fetch the blocked or unsubscribed contacts | [optional]
 **endDate** | **string**| Mandatory if startDate is used. Ending date (YYYY-MM-DD) till which you want to fetch the blocked or unsubscribed contacts | [optional]
 **limit** | **int**| Number of documents returned per page | [optional] [default to 50]
 **offset** | **int**| Index of the first document on the page | [optional] [default to 0]
 **senders** | [**string[]**](../Model/string.md)| Comma separated list of emails of the senders from which contacts are blocked or unsubscribed | [optional]
 **sort** | **string**| Sort the results in the ascending/descending order of record creation. Default order is **descending** if &#x60;sort&#x60; is not passed | [optional] [default to desc]

### Return type

[**\SendinBlue\Client\Model\GetTransacBlockedContacts**](../Model/GetTransacBlockedContacts.md)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **getTransacEmailContent**
> \SendinBlue\Client\Model\GetTransacEmailContent getTransacEmailContent($uuid)

Get the personalized content of a sent transactional email

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$uuid = "uuid_example"; // string | Unique id of the transactional email that has been sent to a particular contact

try {
    $result = $apiInstance->getTransacEmailContent($uuid);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->getTransacEmailContent: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **uuid** | **string**| Unique id of the transactional email that has been sent to a particular contact |

### Return type

[**\SendinBlue\Client\Model\GetTransacEmailContent**](../Model/GetTransacEmailContent.md)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **getTransacEmailsList**
> \SendinBlue\Client\Model\GetTransacEmailsList getTransacEmailsList($email, $templateId, $messageId, $startDate, $endDate, $sort, $limit, $offset)

Get the list of transactional emails on the basis of allowed filters

This endpoint will show the list of emails for past 30 days by default. To retrieve emails before that time, please pass startDate and endDate in query filters.

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$email = "email_example"; // string | Mandatory if templateId and messageId are not passed in query filters. Email address to which transactional email has been sent.
$templateId = 789; // int | Mandatory if email and messageId are not passed in query filters. Id of the template that was used to compose transactional email.
$messageId = "messageId_example"; // string | Mandatory if templateId and email are not passed in query filters. Message ID of the transactional email sent.
$startDate = "startDate_example"; // string | Mandatory if endDate is used. Starting date (YYYY-MM-DD) from which you want to fetch the list. Maximum time period that can be selected is one month.
$endDate = "endDate_example"; // string | Mandatory if startDate is used. Ending date (YYYY-MM-DD) till which you want to fetch the list. Maximum time period that can be selected is one month.
$sort = "desc"; // string | Sort the results in the ascending/descending order of record creation. Default order is **descending** if `sort` is not passed
$limit = 500; // int | Number of documents returned per page
$offset = 0; // int | Index of the first document in the page

try {
    $result = $apiInstance->getTransacEmailsList($email, $templateId, $messageId, $startDate, $endDate, $sort, $limit, $offset);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->getTransacEmailsList: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **email** | **string**| Mandatory if templateId and messageId are not passed in query filters. Email address to which transactional email has been sent. | [optional]
 **templateId** | **int**| Mandatory if email and messageId are not passed in query filters. Id of the template that was used to compose transactional email. | [optional]
 **messageId** | **string**| Mandatory if templateId and email are not passed in query filters. Message ID of the transactional email sent. | [optional]
 **startDate** | **string**| Mandatory if endDate is used. Starting date (YYYY-MM-DD) from which you want to fetch the list. Maximum time period that can be selected is one month. | [optional]
 **endDate** | **string**| Mandatory if startDate is used. Ending date (YYYY-MM-DD) till which you want to fetch the list. Maximum time period that can be selected is one month. | [optional]
 **sort** | **string**| Sort the results in the ascending/descending order of record creation. Default order is **descending** if &#x60;sort&#x60; is not passed | [optional] [default to desc]
 **limit** | **int**| Number of documents returned per page | [optional] [default to 500]
 **offset** | **int**| Index of the first document in the page | [optional] [default to 0]

### Return type

[**\SendinBlue\Client\Model\GetTransacEmailsList**](../Model/GetTransacEmailsList.md)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **sendTestTemplate**
> sendTestTemplate($templateId, $sendTestEmail)

Send a template to your test list

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$templateId = 789; // int | Id of the template
$sendTestEmail = new \SendinBlue\Client\Model\SendTestEmail(); // \SendinBlue\Client\Model\SendTestEmail | 

try {
    $apiInstance->sendTestTemplate($templateId, $sendTestEmail);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->sendTestTemplate: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **templateId** | **int**| Id of the template |
 **sendTestEmail** | [**\SendinBlue\Client\Model\SendTestEmail**](../Model/SendTestEmail.md)|  |

### Return type

void (empty response body)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **sendTransacEmail**
> \SendinBlue\Client\Model\CreateSmtpEmail sendTransacEmail($sendSmtpEmail)

Send a transactional email

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$sendSmtpEmail = new \SendinBlue\Client\Model\SendSmtpEmail(); // \SendinBlue\Client\Model\SendSmtpEmail | Values to send a transactional email

try {
    $result = $apiInstance->sendTransacEmail($sendSmtpEmail);
    print_r($result);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->sendTransacEmail: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **sendSmtpEmail** | [**\SendinBlue\Client\Model\SendSmtpEmail**](../Model/SendSmtpEmail.md)| Values to send a transactional email |

### Return type

[**\SendinBlue\Client\Model\CreateSmtpEmail**](../Model/CreateSmtpEmail.md)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **smtpBlockedContactsEmailDelete**
> smtpBlockedContactsEmailDelete($email)

Unblock or resubscribe a transactional contact

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$email = "email_example"; // string | contact email (urlencoded) to unblock.

try {
    $apiInstance->smtpBlockedContactsEmailDelete($email);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->smtpBlockedContactsEmailDelete: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **email** | **string**| contact email (urlencoded) to unblock. |

### Return type

void (empty response body)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **smtpLogMessageIdDelete**
> smtpLogMessageIdDelete($messageId)

Delete an SMTP transactional log

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$messageId = "messageId_example"; // string | MessageId of the transactional log to delete

try {
    $apiInstance->smtpLogMessageIdDelete($messageId);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->smtpLogMessageIdDelete: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **messageId** | **string**| MessageId of the transactional log to delete |

### Return type

void (empty response body)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)

# **updateSmtpTemplate**
> updateSmtpTemplate($templateId, $smtpTemplate)

Update an email template

### Example
```php
<?php
require_once(__DIR__ . '/vendor/autoload.php');

// Configure API key authorization: api-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('api-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('api-key', 'Bearer');
// Configure API key authorization: partner-key
$config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKey('partner-key', 'YOUR_API_KEY');
// Uncomment below to setup prefix (e.g. Bearer) for API key, if needed
// $config = SendinBlue\Client\Configuration::getDefaultConfiguration()->setApiKeyPrefix('partner-key', 'Bearer');

$apiInstance = new SendinBlue\Client\Api\TransactionalEmailsApi(
    // If you want use custom http client, pass your client which implements `GuzzleHttp\ClientInterface`.
    // This is optional, `GuzzleHttp\Client` will be used as default.
    new GuzzleHttp\Client(),
    $config
);
$templateId = 789; // int | id of the template
$smtpTemplate = new \SendinBlue\Client\Model\UpdateSmtpTemplate(); // \SendinBlue\Client\Model\UpdateSmtpTemplate | values to update in transactional email template

try {
    $apiInstance->updateSmtpTemplate($templateId, $smtpTemplate);
} catch (Exception $e) {
    echo 'Exception when calling TransactionalEmailsApi->updateSmtpTemplate: ', $e->getMessage(), PHP_EOL;
}
?>
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **templateId** | **int**| id of the template |
 **smtpTemplate** | [**\SendinBlue\Client\Model\UpdateSmtpTemplate**](../Model/UpdateSmtpTemplate.md)| values to update in transactional email template |

### Return type

void (empty response body)

### Authorization

[api-key](../../README.md#api-key), [partner-key](../../README.md#partner-key)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../../README.md#documentation-for-api-endpoints) [[Back to Model list]](../../README.md#documentation-for-models) [[Back to README]](../../README.md)
