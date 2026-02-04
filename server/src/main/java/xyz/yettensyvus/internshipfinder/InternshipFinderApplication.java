package xyz.yettensyvus.internshipfinder;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class InternshipFinderApplication {

	public static void main(String[] args) {
		SpringApplication.run(InternshipFinderApplication.class, args);
	}

}
