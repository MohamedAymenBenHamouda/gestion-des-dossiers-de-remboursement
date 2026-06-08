package com.pfe.medical.repository;

import com.pfe.medical.entity.User;
import com.pfe.medical.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByCin(String cin);
    List<User> findByRole(Role role);
    List<User> findByRoleAndActif(Role role, boolean actif);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role")
    long countByRole(Role role);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.actif = true")
    long countByRoleAndActif(Role role);
}
