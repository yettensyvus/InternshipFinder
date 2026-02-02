package xyz.yettensyvus.internshipfinder;

import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Encoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;

class JwtSecretGeneratorTest {

    @Test
    void generateHs512Secret() {
        SecretKey key = Keys.secretKeyFor(SignatureAlgorithm.HS512);

        String base64Secret = Encoders.BASE64.encode(key.getEncoded());

        System.out.println("HS512 JWT SECRET:");
        System.out.println(base64Secret);
        System.out.println("Key size (bits): " + (key.getEncoded().length * 8));
    }
}
