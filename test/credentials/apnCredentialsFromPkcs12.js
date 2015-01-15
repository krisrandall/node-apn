var apnCredentialsFromPkcs12 = require("../../lib/credentials/apnCredentialsFromPkcs12");

var APNKey = require("../../lib/credentials/APNKey");
var APNCertificate = require("../../lib/credentials/APNCertificate");

var fs = require("fs");

describe("apnCredentialsFromPkcs12", function() {
	describe("with PKCS#12 data", function() {
		var p12, properties;
		describe("return value", function() {

			before(function() {
				p12 = fs.readFileSync("test/credentials/support/certIssuerKey.p12");
			});

			beforeEach(function() {
				credentials = apnCredentialsFromPkcs12(p12);
			});

			it("is an object", function() {
				expect(credentials).to.be.an('object');
			});

			it("contains a private key", function() {
				expect(credentials).to.include.keys("key");
			});

			describe("private key", function() {
				it("is an instance of APNKey", function() {
					expect(credentials["key"]).to.be.an.instanceof(APNKey);
				});

				it("has the correct fingerprint", function() {
					expect(credentials["key"].fingerprint()).to.equal("2d594c9861227dd22ba5ae37cc9354e9117a804d");
				});
			});

			it("contains a certificate chain", function() {
				expect(credentials).to.include.keys("certificates");
			});

			describe("certificate chain", function() {
				it("is an array", function() {
					expect(credentials.certificates).to.be.an('array');
				});

				it("contains the correct number of certificates", function() {
					expect(credentials.certificates.length).to.equal(2);
				});

				it("contains APNCertificate objects", function() {
					var certificates = credentials.certificates;
					for(var i in certificates) {
						expect(certificates[i]).to.be.an.instanceof(APNCertificate);
					}
				});

				it("contains certificates with the correct fingerprints", function() {
					var fingerprints = ["2d594c9861227dd22ba5ae37cc9354e9117a804d", "ccff221d67cb3335649f9b4fbb311948af76f4b2"];
					var certificates = credentials.certificates;
					for(var i in certificates) {
						expect(certificates[i].key().fingerprint()).to.equal(fingerprints[i])
					}
				});
			});
		});

		// OpenSSL exports keys having no passphrase as a C string with a \0 byte appended
		describe("having empty passphrase (OpenSSL-CLI-generated file)", function() {
			describe("return value", function() {
				it("has the correct key", function() {
					p12 = fs.readFileSync("test/credentials/support/certIssuerKeyOpenSSL.p12");
					properties = apnCredentialsFromPkcs12(p12);
					expect(properties.key.fingerprint()).to.equal("2d594c9861227dd22ba5ae37cc9354e9117a804d");
				});
			});
		});

		describe("with correct passphrase", function() {
			describe("return value", function() {
				it("has the correct key", function() {
					p12 = fs.readFileSync("test/credentials/support/certIssuerKeyPassphrase.p12");
					properties = apnCredentialsFromPkcs12(p12, "apntest");
					expect(properties.key.fingerprint()).to.equal("2d594c9861227dd22ba5ae37cc9354e9117a804d");
				});
			});
		});
		describe("with incorrect passphrase", function() {
			it("throws", function() {
				p12 = fs.readFileSync("test/credentials/support/certIssuerKeyPassphrase.p12");
				expect(function() {
					apnCredentialsFromPkcs12(p12, "notthepassphrase");
				}).to.throw("unable to read credentials, incorrect passphrase");
			});
		});

		// Unclear whether multiple keys in one PKCS#12 file can be distinguished
		// at present if there's more than one just throw a warning. Should also
		// do the same thing in apnKeyFromPem
		describe("multiple keys", function() {});
	});

	it("returns undefined for undefined", function() {
		expect(apnCredentialsFromPkcs12()).to.be.undefined;
	});
});