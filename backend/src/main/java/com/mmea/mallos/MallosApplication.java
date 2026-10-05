package com.mmea.mallos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
@org.springframework.scheduling.annotation.EnableScheduling
public class MallosApplication {

	public static void main(String[] args) {
		SpringApplication.run(MallosApplication.class, args);
	}

}
