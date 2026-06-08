package com.pfe.medical.repository;

import com.pfe.medical.entity.FamilyMember;
import com.pfe.medical.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FamilyMemberRepository extends JpaRepository<FamilyMember, Long> {
    List<FamilyMember> findByOwner(User owner);
}
