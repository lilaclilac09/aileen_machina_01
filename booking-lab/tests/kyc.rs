use booking_lab::kyc::{host_allowed, Kyc};

#[test]
fn otp_off_writes_nothing() {
    let kyc = Kyc::new(false);
    let err = kyc.issue("acct-test-01", "ada@example.test").unwrap_err();
    assert_eq!(err, "otp-off");
    assert!(kyc.outbox().is_empty());
}

#[test]
fn person_types_the_code() {
    let kyc = Kyc::new(true);
    let link = kyc.issue("acct-test-01", "ada@example.test").unwrap();
    let token = link.rsplit('/').next().unwrap().to_string();
    let code = kyc.outbox()[0].code.clone();
    assert!(kyc.confirm(&token, "000000").is_err());
    assert!(kyc.confirm(&token, &code).is_ok());
}

#[test]
fn production_hosts_are_rejected() {
    assert!(host_allowed("127.0.0.1", &[]));
    assert!(!host_allowed("visa.vfsglobal.com", &["visa.vfsglobal.com"]));
    assert!(!host_allowed("www.usvisa-info.com", &[]));
    assert!(!host_allowed("travel.state.gov", &[]));
    assert!(!host_allowed("lab.example.test", &[]));
    assert!(host_allowed("lab.example.test", &["lab.example.test"]));
}
