# Scope

This lab measures detection on a fake calendar. The report is catch rate and false-pass rate. No production password is stored.

## Environments

| Name | Allowed |
| --- | --- |
| This machine | `127.0.0.1:18080` only |
| Counterparty staging | A hostname they name, after it passes `host_allowed` |
| Production visa sites | Forbidden |

Forbidden names include `vfsglobal.com`, `usvisa-info.com`, `travel.state.gov`, `diplo.de`, and `tlscontact.com`. A staging host they send must not be one of those.

## Test accounts

The other party opens and closes these. The lab does not invent real people.

| Id | Mailbox | Code |
| --- | --- | --- |
| `acct-test-01` | `ada@example.test` | Off until `POST /kyc/otp` with `{"enabled":true}` |

When the switch is off, `/kyc/issue` returns `otp-off` and writes nothing.

## Consent

1. They enable the test code.
2. `/kyc/issue` returns a `http://127.0.0.1:18080/kyc/{token}` link and puts the same note in the local outbox.
3. The person reads that note and types the code into `/kyc/confirm`.
4. A wrong code returns `code-mismatch`. The lab does not fetch mail from them.

## Report

`/drill` returns `human_pass_rate`, `script_catch_rate`, and `bulk_catch_rate`. That is the whole report.
