package com.pfe.medical.config;

import com.pfe.medical.entity.User;
import com.pfe.medical.enums.Role;
import com.pfe.medical.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DataSource dataSource;

    @Override
    public void run(String... args) {
        // Ensure database has 'verified' column (backfill schema if needed)
        try (Connection conn = dataSource.getConnection(); Statement st = conn.createStatement()) {
            String sql = "ALTER TABLE users ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;";
            st.execute(sql);
            String sql2 = "ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;";
            st.execute(sql2);
            log.info("✅ Database schema checked/updated: ensured 'verified' and 'must_change_password' columns exist");
        } catch (Exception e) {
            log.warn("Unable to auto-add 'verified' column: {}", e.getMessage());
        }
        // Créer l'admin par défaut si inexistant
        if (!userRepository.existsByEmail("admin@medical.tn")) {
            User admin = User.builder()
                    .nom("Admin")
                    .prenom("Système")
                    .email("admin@medical.tn")
                    .password(passwordEncoder.encode("MonMotDePasse@2026"))
                    .role(Role.ROLE_ADMIN)
                    .actif(true)
                    .verified(true)
                    .build();
            userRepository.save(admin);
            log.info("✅ Compte admin créé: admin@medical.tn / MonMotDePasse@2026");
        } else {
            User admin = userRepository.findByEmail("admin@medical.tn").get();
            if (!admin.isVerified()) {
                admin.setVerified(true);
                userRepository.save(admin);
            }
        }

        // Créer un agent de demo
        if (!userRepository.existsByEmail("agent@medical.tn")) {
            User agent = User.builder()
                    .nom("Hachani")
                    .prenom("Hedi")
                    .email("agent@medical.tn")
                    .password(passwordEncoder.encode("TestSecure1234!"))
                    .role(Role.ROLE_AGENT)
                    .actif(true)
                    .verified(true)
                    .build();
            userRepository.save(agent);
            log.info("✅ Compte agent créé: agent@medical.tn / TestSecure1234!");
        } else {
            User agent = userRepository.findByEmail("agent@medical.tn").get();
            if (!agent.isVerified()) {
                agent.setVerified(true);
                userRepository.save(agent);
            }
        }
    }
}
