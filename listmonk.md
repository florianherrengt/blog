# Listmonk newsletter infrastructure

Last updated: 2026-08-19

This document records the newsletter setup for `florianherrengt.com`. It explains what was configured, how the components communicate, why each decision was made, what was tested and what remains unfinished.

## Current status

The infrastructure is configured and publicly reachable.

Confirmed working:

- `newsletter.florianherrengt.com` resolves through Cloudflare.
- The site returns HTTP `200` over IPv4 and IPv6.
- TLS validation succeeds.
- The Amazon SES identity for `newsletter.florianherrengt.com` is verified.
- SES DKIM and the custom Mail From domain are verified.
- Listmonk is configured to send through SES.
- SES bounce and complaint notifications are connected to SNS.
- SNS invokes a private Lambda relay.
- The Lambda relay forwards signed SNS notifications to Listmonk.
- A valid synthetic SNS bounce reached Listmonk and returned HTTP `200` during setup.
- The relay source passes its local syntax check and unit test.
- The Cloudflare Tunnel exposes only the public Listmonk paths, the SES webhook and the exact ALTCHA challenge endpoint.
- Built-in ALTCHA CAPTCHA is enabled with complexity `300000`.
- A live browser test completed the ALTCHA proof and changed the widget state to `Verified`.
- The public subscription page is branded as Florian Herrengt and hides the optional name field, single-list selector, archive link, ALTCHA branding and Listmonk footer.

Not yet completed:

- The four-recipient SES simulator test has not been sent.
- A private test list exists but is empty.
- No real message has been sent to `contact@florianherrengt.com` to inspect SPF, DKIM, DMARC, From and Reply-To headers.
- The 81 EmailOctopus contacts have not been imported.
- The retry after the last DNS-related Lambda failure was not observed directly in AWS logs.
- DMARC is in monitoring mode with `p=none`.

The system is configured but a complete production-style end-to-end test is still required before treating it as fully proven.

## Security note

No credentials, passwords, SMTP secrets, Cloudflare tunnel tokens or API tokens belong in this file.

The SES SMTP credentials are stored in Listmonk settings. The Cloudflare tunnel token is managed by the running `cloudflared` service. The Lambda environment contains only non-secret routing values.

The repository `.dockerignore` excludes `*.md`, so the current Docker build does not copy this file into the public Nginx image. The file can still be visible if it is committed to a public source repository. Review operational identifiers before publishing the repository history.

If a credential is ever exposed, rotate it in the provider and update the service that consumes it.

## Architecture

### Public web traffic

```text
Browser
  -> Cloudflare DNS and proxy
  -> Cloudflare Tunnel named helium
  -> http://localhost:4480 on helium
  -> Listmonk
```

### Outgoing email

```text
Listmonk
  -> Amazon SES SMTP endpoint in us-east-1
  -> Recipient mail provider
  -> Recipient
```

### Bounce and complaint feedback

```text
Recipient mail provider
  -> Amazon SES
  -> SNS topic listmonk-ses-feedback
  -> Lambda function listmonk-ses-relay
  -> https://newsletter.florianherrengt.com/webhooks/service/ses
  -> Listmonk bounce processor
  -> Bounce record and subscriber action
```

The recipient provider does not call SNS directly. It reports a delivery failure or complaint to SES. SES publishes the resulting event to SNS.

## Important identifiers

| Resource | Value |
| --- | --- |
| AWS account | `338094269593` |
| AWS region | `us-east-1` |
| SES identity | `newsletter.florianherrengt.com` |
| Custom Mail From domain | `bounce.newsletter.florianherrengt.com` |
| SMTP sender | `Florian Herrengt <hello@newsletter.florianherrengt.com>` |
| Reply-To | `contact@florianherrengt.com` |
| SNS topic | `listmonk-ses-feedback` |
| SNS topic ARN | `arn:aws:sns:us-east-1:338094269593:listmonk-ses-feedback` |
| Lambda function | `listmonk-ses-relay` |
| Lambda ARN | `arn:aws:lambda:us-east-1:338094269593:function:listmonk-ses-relay` |
| SNS subscription ARN | `arn:aws:sns:us-east-1:338094269593:listmonk-ses-feedback:f923ef64-f9ca-45f2-a34a-b004ce82512b` |
| Listmonk webhook | `https://newsletter.florianherrengt.com/webhooks/service/ses` |
| Cloudflare tunnel | `helium` |
| Cloudflare tunnel ID | `87ad452b-b9ca-4b7c-ab00-65580a520d64` |

## Cloudflare and DNS

### Authoritative DNS

The domain is delegated to these Cloudflare nameservers:

- `greg.ns.cloudflare.com`
- `liv.ns.cloudflare.com`

The registry, the Mac resolver, Cloudflare Resolver, Google Public DNS and Quad9 all returned the Cloudflare delegation on 2026-08-19.

`newsletter.florianherrengt.com` is proxied by Cloudflare. Its public A and AAAA answers are Cloudflare edge addresses. Do not hardcode those edge addresses.

### Tunnel

The Cloudflare tunnel is named `helium`.

The main published route is restricted by a path allowlist:

```text
hostname: newsletter.florianherrengt.com
path: ^/(subscription|link|campaign|public)(/.*)?$|^/webhooks/service/ses$|^/api/public/captcha/altcha$
origin: http://localhost:4480
```

The route intentionally exposes:

- `/subscription/*` for subscribing, confirmation and unsubscribe flows
- `/link/*` and `/campaign/*` for links generated in newsletters
- `/public/*` for Listmonk's public static assets
- exactly `/webhooks/service/ses` for SES feedback relayed by Lambda
- exactly `/api/public/captcha/altcha` for built-in ALTCHA challenges

It does not expose the Listmonk admin interface or the rest of `/api`. The ALTCHA exception is deliberately exact; widening it to `/api/public/*` would expose more application surface than the widget requires.

During setup, Cloudflare showed one healthy replica with four edge connections in London. The observed edge locations were `lhr19`, `lhr13`, `lhr14` and `lhr18`.

An additional route was created while investigating direct SNS delivery:

```text
ses-webhook.florianherrengt.com
path: ^/webhooks/service/ses$
origin: http://localhost:4480
```

The Lambda relay uses the main `newsletter.florianherrengt.com` hostname. The `ses-webhook` route is not part of the active feedback path. It can be removed after the final end-to-end test if it is not needed for another purpose.

### DNS propagation incident

The domain had just been transferred when the setup began.

The `.com` registry had been updated to Cloudflare but some recursive resolvers still cached the old Route 53 delegation. The old Route 53 zone did not contain `newsletter.florianherrengt.com`.

This created inconsistent behavior:

- Resolvers using the new Cloudflare delegation returned the correct Cloudflare addresses.
- Resolvers using the cached Route 53 delegation returned no address.
- Browsers and Lambda sometimes worked and sometimes returned a DNS failure.
- Lambda logged `TypeError: fetch failed` before the request reached Cloudflare.

The delegation TTL was 172800 seconds, which is 48 hours. The old Route 53 negative response also had a long cache lifetime.

By 2026-08-19, all tested resolvers agreed on Cloudflare and the public site returned HTTP `200` over IPv4 and IPv6.

### Useful DNS checks

```sh
dig +short florianherrengt.com NS
dig +short newsletter.florianherrengt.com A
dig +short newsletter.florianherrengt.com AAAA
dig +short bounce.newsletter.florianherrengt.com MX
dig +short bounce.newsletter.florianherrengt.com TXT
dig +short _dmarc.florianherrengt.com TXT
```

The parent delegation can be checked directly:

```sh
dig +noall +authority florianherrengt.com NS @a.gtld-servers.net
```

The authoritative Cloudflare answers can be checked directly:

```sh
dig +noall +answer newsletter.florianherrengt.com A @greg.ns.cloudflare.com
dig +noall +answer newsletter.florianherrengt.com A @liv.ns.cloudflare.com
```

## Listmonk deployment

### Runtime

Listmonk runs through Coolify on the `helium` server.

Observed versions during setup:

- Coolify `v4.1.2`
- Listmonk `v6.2.0`
- Listmonk build `ef0a7587`
- Linux ARM64 container

Listmonk listens on port `9000` inside its runtime. The host exposes the application to the tunnel on port `4480`.

The database is PostgreSQL on the private `nassington` host. Database credentials are intentionally omitted.

### Public URL

The Listmonk public root URL is:

```text
https://newsletter.florianherrengt.com
```

This matters because Listmonk uses the root URL to generate subscription links, campaign links, tracking URLs and public assets.

### SMTP settings

Listmonk sends through the Amazon SES SMTP endpoint in `us-east-1`.

The final sender is:

```text
Florian Herrengt <hello@newsletter.florianherrengt.com>
```

The Reply-To address is:

```text
contact@florianherrengt.com
```

`no-reply@newsletter.florianherrengt.com` was discussed but was not selected as the final sender.

The SES SMTP username and password are stored in Listmonk. They must not be committed to Git or copied into documentation.

The maximum SMTP connection count is `10`.

### Sending rate

Listmonk performance settings are:

| Setting | Value |
| --- | ---: |
| Concurrent workers | 2 |
| Message rate per worker | 6 per second |
| Effective maximum | 12 messages per second |
| Batch size | 1000 |
| Maximum error threshold | 1000 |

SES permits `14` messages per second. Listmonk is intentionally limited to `12` messages per second to leave headroom.

The SES value is a send rate, not a worker count. Listmonk computes its maximum rate as:

```text
2 workers x 6 messages per second = 12 messages per second
```

The SMTP maximum connection count is a separate limit. It does not override the 12 messages per second application limit.

### Bounce settings

Listmonk bounce processing is enabled.

| Bounce type | Count | Action |
| --- | ---: | --- |
| Soft | 2 | None |
| Hard | 1 | Blocklist |
| Complaint | 1 | Blocklist |

These options are also enabled:

- Bounce webhooks
- Amazon SES processing

The rationale is to avoid blocking a subscriber after one temporary error while immediately blocking addresses that hard bounce or complain.

### Subscription CAPTCHA

Listmonk's built-in ALTCHA CAPTCHA is enabled under **Settings -> Security**. It uses complexity `300000` and requires no external CAPTCHA account or separate service.

The public subscription form loads the bundled widget from:

```text
/public/static/altcha.umd.js
```

The widget requests a signed proof-of-work challenge from:

```text
/api/public/captcha/altcha
```

The widget initially failed with `Verification failed` because the tunnel's path allowlist blocked this challenge URL. Direct access to Listmonk on `helium:4480` returned HTTP `200`, while the public hostname returned HTTP `404`. Adding only the exact challenge path to the tunnel allowlist fixed the mismatch.

### Public subscription page branding

The public page is intentionally minimal. Its visible content is:

- the `FH` logo
- `Get new posts by email`
- `Occasional writing by Florian Herrengt. No spam.`
- the email field
- the ALTCHA checkbox
- the Subscribe button

Listmonk's General settings are:

| Setting | Value |
| --- | --- |
| Site name | `Florian Herrengt` |
| Logo URL | `https://blog.florianherrengt.com/favicon.svg` |
| Favicon URL | `https://blog.florianherrengt.com/favicon.svg` |
| Public archive | Disabled |

Public custom CSS removes the default card appearance, matches the blog's system-font light/dark theme and hides the optional name row, the only-list selector and the Listmonk footer. Hiding the list selector does not remove its checked input from the form, so new subscribers are still added to the `Blog` list.

Public custom JavaScript changes the heading and description, sends the logo link to `https://blog.florianherrengt.com/`, and sets ALTCHA's `hidefooter` and `hidelogo` attributes. It handles both early and late script loading because Listmonk loads `/public/custom.js` asynchronously.

Cloudflare cached the first custom JavaScript response for four hours. After the final customization was saved, the exact `/public/custom.js` and `/public/custom.css` URLs, with and without Listmonk's version query string, were purged from Cloudflare. This made the final version public immediately without purging unrelated site assets.

### Lists observed during setup

The following lists existed before the SES simulator test:

| List | Type | Opt-in | Subscribers observed |
| --- | --- | --- | ---: |
| Default list | Private | Single opt-in | 1 |
| Opt-in list | Public | Double opt-in | 1 unconfirmed |

A temporary list was created on 2026-08-19:

| List | Type | Opt-in | Current state |
| --- | --- | --- | --- |
| SES end-to-end test 2026-08-19 | Private | Single opt-in | Empty |

No simulator address or real address was added to the temporary list. No test campaign was sent.

## Amazon SES

### Region and production access

SES is configured in `us-east-1`.

The account has production access with these limits:

- 50,000 messages per 24 hours
- 14 messages per second

### Sending identity

The verified SES identity is:

```text
newsletter.florianherrengt.com
```

Using a newsletter subdomain isolates newsletter sending from the main domain while keeping the brand visible.

SES reported the identity and DKIM configuration as verified. The SES DKIM CNAME records were added in Cloudflare. The selector names were not copied into this document. Retrieve them from the SES identity page if they are needed for an audit.

### Custom Mail From

The custom Mail From domain is:

```text
bounce.newsletter.florianherrengt.com
```

The DNS records are:

```dns
bounce.newsletter.florianherrengt.com. MX 10 feedback-smtp.us-east-1.amazonses.com.
bounce.newsletter.florianherrengt.com. TXT "v=spf1 include:amazonses.com ~all"
```

The custom Mail From domain aligns SES envelope handling with the newsletter subdomain and gives SES a dedicated return path for feedback.

### DMARC

The root DMARC record is:

```dns
_dmarc.florianherrengt.com. TXT "v=DMARC1; p=none;"
```

There is no separate `_dmarc.newsletter.florianherrengt.com` record. The root policy therefore applies to the newsletter subdomain.

`p=none` is monitoring only. It does not instruct receiving providers to quarantine or reject failures. Move to `quarantine` or `reject` only after reviewing real mail authentication results and confirming that all legitimate senders align correctly.

### Feedback notifications

The SES identity notification configuration is:

| Event | Destination |
| --- | --- |
| Bounce | SNS topic `listmonk-ses-feedback` |
| Complaint | SNS topic `listmonk-ses-feedback` |
| Delivery | Not configured |

Original message headers are included in bounce and complaint notifications.

Email feedback forwarding is disabled. SNS is the feedback path.

Delivery notifications were deliberately left disabled because Listmonk needs bounce and complaint events for list hygiene. Sending every successful delivery through SNS and Lambda would create unnecessary events and cost.

### Why SNS is required

SES publishes identity-level bounce and complaint notifications to SNS. SNS then invokes Lambda.

SNS provides:

- A native SES feedback destination
- Managed retries
- A private AWS-to-AWS Lambda invocation path
- Decoupling between SES and the public Listmonk endpoint

The SNS topic is not a public webhook. An internet user cannot invoke Lambda through SNS without AWS permissions.

## SNS

The topic is a Standard SNS topic:

```text
arn:aws:sns:us-east-1:338094269593:listmonk-ses-feedback
```

The Lambda subscription is confirmed:

```text
arn:aws:sns:us-east-1:338094269593:listmonk-ses-feedback:f923ef64-f9ca-45f2-a34a-b004ce82512b
```

Raw message delivery is not used. Lambda receives the normal SNS event wrapper.

SNS invokes Lambda once for each bounce or complaint event. It does not invoke Lambda for every successful message because delivery notifications are disabled.

If Lambda fails, SNS retries according to its managed retry policy.

## Lambda relay

### Runtime configuration

| Setting | Value |
| --- | --- |
| Function name | `listmonk-ses-relay` |
| Runtime | Node.js 24.x |
| Architecture | x86_64 |
| Memory | 128 MB |
| Timeout | 20 seconds |
| Handler | `index.handler` |

Environment variables:

```text
TOPIC_ARN=arn:aws:sns:us-east-1:338094269593:listmonk-ses-feedback
WEBHOOK_URL=https://newsletter.florianherrengt.com/webhooks/service/ses
```

Neither environment variable is a secret.

The function has no Function URL and no API Gateway endpoint. It is not directly exposed to the internet.

### Invocation permission

The Lambda resource policy statement is named:

```text
AllowListmonkSesFeedbackTopic
```

It allows the `sns.amazonaws.com` service principal to invoke the function only when both conditions match:

- Source ARN is the exact `listmonk-ses-feedback` topic ARN.
- Source account is `338094269593`.

This prevents arbitrary SNS topics from invoking the function.

### Relay behavior

The relay:

1. Rejects events that are not SNS events.
2. Rejects events from a topic other than the configured topic.
3. Rejects SNS message types other than `Notification`.
4. Requires the SNS fields that Listmonk needs for signature verification.
5. Converts Lambda event property names such as `SigningCertUrl` to the HTTP SNS property name `SigningCertURL`.
6. Reconstructs the signed SNS HTTP envelope.
7. Sends the envelope to Listmonk as JSON.
8. Includes the SNS message type, message ID and topic ARN headers.
9. Uses a 10 second HTTP request timeout.
10. Throws on non-2xx responses so SNS can retry.

Listmonk downloads the Amazon SNS signing certificate and verifies the SNS signature. Lambda does not bypass Listmonk signature validation.

### Current relay source

```js
const TOPIC_ARN = process.env.TOPIC_ARN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

function requireConfig(name, value) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

function snsEnvelope(sns) {
  const envelope = {
    Type: sns.Type,
    MessageId: sns.MessageId,
    TopicArn: sns.TopicArn,
    Message: sns.Message,
    Timestamp: sns.Timestamp,
    SignatureVersion: sns.SignatureVersion,
    Signature: sns.Signature,
    SigningCertURL: sns.SigningCertUrl ?? sns.SigningCertURL,
    UnsubscribeURL: sns.UnsubscribeUrl ?? sns.UnsubscribeURL,
  };

  if (sns.Subject) {
    envelope.Subject = sns.Subject;
  }

  return envelope;
}

function validateRecord(record) {
  if (record?.EventSource !== "aws:sns" || !record.Sns) {
    throw new Error("Rejected non-SNS event");
  }

  if (record.Sns.TopicArn !== TOPIC_ARN) {
    throw new Error("Rejected event from an unexpected SNS topic");
  }

  if (record.Sns.Type !== "Notification") {
    throw new Error("Rejected unexpected SNS message type");
  }

  const envelope = snsEnvelope(record.Sns);
  for (const field of [
    "MessageId",
    "TopicArn",
    "Message",
    "Timestamp",
    "SignatureVersion",
    "Signature",
    "SigningCertURL",
  ]) {
    if (!envelope[field]) {
      throw new Error(`Rejected SNS event missing ${field}`);
    }
  }

  return envelope;
}

async function forward(record) {
  const envelope = validateRecord(record);
  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "content-type": "text/plain; charset=UTF-8",
      "x-amz-sns-message-type": envelope.Type,
      "x-amz-sns-message-id": envelope.MessageId,
      "x-amz-sns-topic-arn": envelope.TopicArn,
    },
    body: JSON.stringify(envelope),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 200);
    throw new Error(`Listmonk returned HTTP ${response.status}: ${detail}`);
  }

  return envelope.MessageId;
}

export async function handler(event) {
  requireConfig("TOPIC_ARN", TOPIC_ARN);
  requireConfig("WEBHOOK_URL", WEBHOOK_URL);

  if (!Array.isArray(event?.Records) || event.Records.length === 0) {
    throw new Error("No SNS records received");
  }

  const messageIds = [];
  for (const record of event.Records) {
    messageIds.push(await forward(record));
  }

  return { forwarded: messageIds.length, messageIds };
}
```

### Relay tests

The local checks are:

```sh
node --check index.mjs
node index.test.mjs
```

The test verifies:

- The expected topic is accepted.
- The webhook URL is used.
- The request method is `POST`.
- The SNS topic ARN header is preserved.
- `SigningCertUrl` is emitted as `SigningCertURL`.

The clean relay source passed both checks.

### Immediate retry behavior

The Lambda function currently performs one outbound HTTP request per invocation.

If the request fails, Lambda throws and SNS retries the invocation. A proposal to add three short retries inside Lambda was discussed but not implemented.

Now that DNS propagation is complete, the original failure mode should no longer occur. An internal short retry could still reduce delay during transient network failures.

## Why Lambda was used

The first design attempted a direct SNS HTTPS subscription to the public Listmonk webhook.

That attempt failed during TLS negotiation with the certificate Cloudflare served. A dedicated Cloudflare hostname and exact webhook path were also tried.

Lambda was selected because:

- SNS can invoke Lambda privately inside AWS.
- No public Lambda endpoint is required.
- The Lambda permission can be restricted to one topic and one account.
- Node.js can connect to the Cloudflare-protected Listmonk endpoint.
- Lambda can reconstruct the normal signed SNS HTTP envelope that Listmonk expects.
- SNS retains retry responsibility when forwarding fails.

The Lambda function is called only for feedback events. It does not run for normal Listmonk page requests or every successful email.

## Security model

### Public components

These endpoints are public because they must be reachable by browsers or service integrations:

- `/subscription/*`
- `/link/*`
- `/campaign/*`
- `/public/*`
- `GET /api/public/captcha/altcha`
- `POST /webhooks/service/ses`

The SES webhook is public but Listmonk verifies the AWS SNS signature before accepting a notification.

### Private components

- The SNS topic requires AWS authorization.
- Lambda has no public URL.
- Lambda invocation is restricted to the exact SNS topic and AWS account.
- The Cloudflare Tunnel does not publish the Listmonk admin interface or general API.
- Administration is performed privately over Tailscale using the `helium` hostname.
- SMTP credentials remain in Listmonk.

### Spam and abuse implications

An internet user cannot directly spam the Lambda function because it has no public endpoint.

An internet user also cannot publish to the SNS topic without AWS permissions.

An attacker can send requests to the public Listmonk SES webhook but unsigned or incorrectly signed payloads are rejected.

The main residual risk is ordinary public endpoint traffic against Cloudflare and Listmonk. Cloudflare provides the public edge and tunnel transport.

## What was tested

### Public site

On 2026-08-19:

- IPv4 returned HTTP `200`.
- IPv6 returned HTTP `200`.
- TLS verification returned success.
- `/subscription/form` returned HTTP `200`.
- `/api/public/captcha/altcha` returned a valid JSON challenge with HTTP `200`.
- The ALTCHA widget completed proof-of-work and displayed `Verified` in Chrome.
- `/admin/` returned HTTP `404` through the public hostname.
- `/api/health` returned HTTP `404`, confirming the general API remained blocked.

### Signed SNS notification

A synthetic bounce payload was published to the real SNS topic. It used the fake address:

```text
relay-healthcheck@invalid.example
```

No email was sent for this synthetic test.

Lambda received a real SNS signature. A temporary diagnostic inside Lambda reconstructed the canonical SNS string, downloaded the Amazon certificate and verified the signature as valid.

Valid test deliveries reached Listmonk and returned HTTP `200`. Listmonk logged:

```text
bounced subscriber ( / relay-healthcheck@invalid.example) not found
```

That message was expected because the fake address was not a Listmonk subscriber. It proves that Listmonk verified and parsed the event before trying to record it.

Earlier malformed test messages produced HTTP `400` and this log:

```text
notification type is not bounce
```

Those errors were caused by the synthetic payload shape. They were not evidence of a production configuration failure.

### DNS-related Lambda failure

The clean deployed Lambda later logged:

```text
TypeError: fetch failed
```

Cloudflare showed no corresponding request. DNS comparison showed that stale Route 53 delegation data was still active in some resolver caches.

SNS retained the failed event for retry. DNS propagation is now complete but the successful retry was not directly observed.

## Full end-to-end test plan

Use the Amazon SES mailbox simulator so bounce and complaint tests do not damage sender reputation.

The temporary private list already exists:

```text
SES end-to-end test 2026-08-19
```

Add these subscribers:

```text
success@simulator.amazonses.com
bounce@simulator.amazonses.com
complaint@simulator.amazonses.com
contact@florianherrengt.com
```

Create one small campaign that targets only this private list.

Expected results:

| Recipient | Expected result |
| --- | --- |
| `success@simulator.amazonses.com` | SES accepts the message and Listmonk records no bounce |
| `bounce@simulator.amazonses.com` | SES publishes a hard bounce and Listmonk blocklists the subscriber |
| `complaint@simulator.amazonses.com` | SES publishes a complaint and Listmonk blocklists the subscriber |
| `contact@florianherrengt.com` | A real message arrives for visual and header inspection |

Check the real message headers for:

- `SPF=pass`
- `DKIM=pass`
- `DMARC=pass`
- From is `Florian Herrengt <hello@newsletter.florianherrengt.com>`
- Reply-To is `contact@florianherrengt.com`
- Return-Path uses the custom Mail From domain

In Listmonk, verify:

- The campaign completed.
- The hard bounce appears in Bounces.
- The complaint appears in Bounces.
- The bounce subscriber is blocklisted.
- The complaint subscriber is blocklisted.
- The successful simulator subscriber is not blocklisted.

In AWS, verify:

- The SNS topic delivered the events.
- Lambda logged successful invocations.
- No new Lambda `ERROR` entries appeared.

After recording the results, delete or archive the temporary campaign, list and simulator subscribers. Deletion should be performed only after confirming that no useful test evidence will be lost.

SES simulator messages do not damage bounce or complaint reputation. AWS bills them like normal messages.

## EmailOctopus contact import

The source file is:

```text
/Users/florian/Downloads/emailoctopus-export-consumer-list-a16f8192-9692-11f1-a48c-f1379562c6ee-filter-1787007868.csv
```

Observed columns:

```text
Identifier
Email address
First name
Last name
Tags
Created
Last changed
```

Validation results:

- 81 data rows
- 81 non-empty email addresses
- 81 syntactically valid email addresses
- No duplicate email rows
- No first names
- No last names
- No tags

The contacts were not imported.

Listmonk requires a CSV header named `email`. The EmailOctopus header is `Email address`, which Listmonk does not recognize. The file must be transformed before import.

A minimal Listmonk import file should look like:

```csv
email,name,attribs
subscriber@example.com,,{}
```

Recommended import behavior:

1. Confirm that the EmailOctopus export contains only contacts who should remain subscribed.
2. Create or select the correct private Listmonk list.
3. Rename `Email address` to `email`.
4. Leave `name` empty because the source names are empty.
5. Optionally preserve the EmailOctopus identifier and timestamps inside `attribs`.
6. Use import mode `subscribe`.
7. Choose the intended subscription status explicitly.
8. Avoid overwrite unless replacing existing subscriber attributes and list memberships is intentional.
9. Check the Listmonk import log after completion.
10. Compare the imported count with the expected count of 81.

The original export does not include a subscription status column. Do not infer consent state from the filename alone.

## Operational runbook

### Before sending a campaign

1. Confirm the target list and subscriber count.
2. Confirm the campaign excludes the temporary SES test list.
3. Check the From and Reply-To values.
4. Send a preview to an address controlled by the owner.
5. Inspect links, unsubscribe behavior and rendering.
6. Confirm Listmonk concurrency is `2` and message rate is `6`.
7. Confirm SES sending is not paused.
8. Start the campaign.
9. Watch the error count during the first batch.

### After sending a campaign

1. Confirm the campaign completed.
2. Review Listmonk bounce records.
3. Review hard bounce and complaint actions.
4. Review SES reputation metrics.
5. Investigate unusual bounce clusters before sending again.

### Listmonk logs

Open the Listmonk application in Coolify and select Logs.

Useful messages:

| Log text | Meaning |
| --- | --- |
| `bounced subscriber ... not found` | The feedback event was valid but the address was not in Listmonk |
| `notification type is not bounce` | The inner SES message was not a supported bounce or complaint payload |
| `error getting SNS cert` | Listmonk could not validate or retrieve the SNS signing certificate |
| `error processing SES notification` | Listmonk rejected the SES notification before recording it |

### Lambda logs

The CloudWatch log group is:

```text
/aws/lambda/listmonk-ses-relay
```

Useful commands in AWS CloudShell:

```sh
aws logs tail /aws/lambda/listmonk-ses-relay --since 30m --format short
aws logs tail /aws/lambda/listmonk-ses-relay --since 30m --format short --filter-pattern ERROR
```

An invocation with `START`, `END` and `REPORT` but no `ERROR` completed successfully.

### SNS inspection

```sh
aws sns list-subscriptions-by-topic \
  --topic-arn arn:aws:sns:us-east-1:338094269593:listmonk-ses-feedback
```

The Lambda subscription should have the expected subscription ARN and should not show `PendingConfirmation`.

### SES notification inspection

```sh
aws ses get-identity-notification-attributes \
  --identities newsletter.florianherrengt.com
```

Expected state:

- Bounce topic is `listmonk-ses-feedback`.
- Complaint topic is `listmonk-ses-feedback`.
- Delivery topic is empty.
- Feedback forwarding is disabled.
- Original headers are enabled for bounce and complaint events.

### Public availability checks

```sh
curl -4 --max-time 8 -I https://newsletter.florianherrengt.com/
curl -6 --max-time 8 -I https://newsletter.florianherrengt.com/
```

Both should complete with valid TLS. The public page should return HTTP `200`.

## Troubleshooting

### Site cannot be reached

Check the layers in this order:

1. `.com` parent delegation
2. Recursive resolver delegation
3. Cloudflare authoritative A and AAAA answers
4. Cloudflare tunnel health
5. Cloudflare published route
6. Host port `4480`
7. Listmonk container health

Do not assume a Cloudflare problem when the request never reaches Cloudflare logs.

### Lambda logs `fetch failed`

Possible causes are DNS resolution, TCP connection failure or TLS negotiation.

Check whether Cloudflare has a matching request:

- No matching request means the failure happened before Cloudflare accepted HTTP traffic.
- A matching request with an HTTP status means the request reached Cloudflare and the origin path can be investigated.

During the original incident, stale Route 53 delegation was the root cause.

### Listmonk returns HTTP 400

Read the Listmonk application log. The public response only says `Invalid data`.

Common setup-time causes were:

- Missing signing certificate URL in a hand-built test
- Inner notification type not set to `Bounce` or `Complaint`
- Malformed synthetic payload

A real SNS signature was verified successfully during setup.

### Subscriber was not blocklisted

Check:

1. The subscriber exists in Listmonk.
2. Bounce processing is enabled.
3. SES processing is enabled.
4. The notification reached Lambda.
5. Lambda returned successfully.
6. Listmonk recorded the bounce.
7. The configured count threshold was reached.

Hard bounce and complaint thresholds are `1`. Soft bounce threshold is `2`.

### Campaign is throttled or paused

Check:

- Listmonk worker concurrency
- Listmonk message rate
- SMTP maximum connections
- SES send rate quota
- SES daily quota
- Campaign error threshold
- Recent SMTP errors

The intended maximum is 12 messages per second.

## Cost and capacity

### SES

SES charges for sent messages and applicable data. Simulator messages are billed like normal SES messages but do not harm bounce or complaint reputation.

### SNS

SNS activity is proportional to bounce and complaint events because delivery notifications are disabled.

### Lambda

Lambda runs only when SNS delivers a feedback event. A normal campaign with no bounce or complaint does not invoke this function for each successful message.

The function uses 128 MB and normally completes in a small fraction of the 20 second timeout.

### Cloudflare

The setup uses Cloudflare DNS, proxying and Tunnel. The tunnel was operating on the available Cloudflare plan during setup.

## Deliberate non-actions

The following items were intentionally not changed:

- No Lambda Function URL was created.
- No API Gateway was created.
- No public Lambda endpoint was created.
- SES delivery notifications were not enabled.
- SES email feedback forwarding was disabled.
- The main domain was not used as the SES sending identity for newsletter traffic.
- DMARC enforcement was not raised above `p=none`.
- The 24 unrelated legacy Lambda functions from 2015 and 2016 were not modified.
- The EmailOctopus contacts were not imported.
- No real email was sent during the completed setup work.
- The temporary SES test list was not deleted.
- No internal Lambda retry loop was added.

## Recommended next actions

1. Complete the SES simulator and real inbox test.
2. Record the campaign result, bounce result, complaint result and authentication header result in this document.
3. Delete or archive the temporary test data after verification.
4. Transform and import the 81 EmailOctopus contacts into the intended list.
5. Confirm the import count and subscription state.
6. Consider adding two or three short retries inside Lambda for transient outbound network failures.
7. Remove the unused `ses-webhook.florianherrengt.com` route if it serves no other purpose.
8. Monitor DMARC results before moving from `p=none` to enforcement.
9. Monitor SES bounce and complaint metrics after the first real campaigns.

## Reference documentation

- Listmonk bounce processing: https://listmonk.app/docs/bounces/
- Listmonk configuration and public routes: https://listmonk.app/docs/configuration/
- Listmonk import API: https://listmonk.app/docs/apis/import/
- Amazon SES mailbox simulator: https://docs.aws.amazon.com/ses/latest/dg/send-an-email-from-console.html
- Amazon SES notification troubleshooting: https://docs.aws.amazon.com/ses/latest/dg/troubleshoot-notifications.html
- Cloudflare Tunnel documentation: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/
