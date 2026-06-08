package com.pfe.medical.service.impl;

import com.pfe.medical.dto.request.FamilyMemberRequest;
import com.pfe.medical.dto.response.FamilyMemberResponse;
import com.pfe.medical.entity.FamilyMember;
import com.pfe.medical.entity.User;
import com.pfe.medical.exception.ResourceNotFoundException;
import com.pfe.medical.repository.FamilyMemberRepository;
import com.pfe.medical.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class FamilyMemberService {

    private final FamilyMemberRepository repo;
    private final UserRepository userRepository;

    public List<FamilyMemberResponse> listForUser(Long userId) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", userId));
        return repo.findByOwner(owner).stream().map(this::map).collect(Collectors.toList());
    }

    public FamilyMemberResponse add(Long userId, FamilyMemberRequest req) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", userId));

        // parse dateNaissance from string supporting multiple formats
        java.time.LocalDate parsedDate = null;
        if (req.getDateNaissance() != null && !req.getDateNaissance().isBlank()) {
            String s = req.getDateNaissance().trim();
            java.time.format.DateTimeFormatter[] fmts = new java.time.format.DateTimeFormatter[] {
                    java.time.format.DateTimeFormatter.ISO_LOCAL_DATE,
                    java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy"),
                    java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")
            };
            for (java.time.format.DateTimeFormatter f : fmts) {
                try {
                    parsedDate = java.time.LocalDate.parse(s, f);
                    break;
                } catch (java.time.format.DateTimeParseException ex) {
                    // try next
                }
            }
            if (parsedDate == null) {
                throw new RuntimeException("Format de date invalide: " + req.getDateNaissance());
            }
        }

        FamilyMember fm = FamilyMember.builder()
                .nom(req.getNom())
                .prenom(req.getPrenom())
                .relation(req.getRelation())
                .dateNaissance(parsedDate)
                .owner(owner)
                .build();
        fm = repo.save(fm);
        return map(fm);
    }

    public void remove(Long userId, Long fmId) {
        FamilyMember fm = repo.findById(fmId)
                .orElseThrow(() -> new ResourceNotFoundException("Membre de famille", fmId));
        if (!fm.getOwner().getId().equals(userId)) {
            throw new RuntimeException("Accès non autorisé");
        }
        repo.delete(fm);
    }

    public FamilyMemberResponse map(FamilyMember fm) {
        return FamilyMemberResponse.builder()
                .id(fm.getId())
                .nom(fm.getNom())
                .prenom(fm.getPrenom())
                .relation(fm.getRelation())
                .dateNaissance(fm.getDateNaissance())
                .build();
    }
}
