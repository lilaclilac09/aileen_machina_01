# booking-lab

Local detection lab on `127.0.0.1:18080`. Not a visa client.

`/drill` reports catch rate and false-pass rate only. The crate stores no password.

KYC is a consent step. The other party turns the test code on or off. The lab writes the link into its own outbox. The person types the code into `/kyc/confirm`. The process does not read an outside mailbox and does not solve a captcha.

Written scope: `SCOPE.md`.

```bash
cargo test
cargo run
curl -s -X POST http://127.0.0.1:18080/drill
```
