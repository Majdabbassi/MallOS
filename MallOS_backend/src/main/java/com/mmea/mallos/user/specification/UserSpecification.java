package com.mmea.mallos.user.specification;

import com.mmea.mallos.user.model.enums.Role;
import com.mmea.mallos.user.model.User;
import com.mmea.mallos.user.model.User_;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class UserSpecification {

    public static Specification<User> hasEmail(String email) {
        return (root, query, cb) -> {
            if (email == null || email.isEmpty()) {
                return cb.conjunction();
            }
            return cb.equal(cb.lower(root.get(User_.email)), email.toLowerCase());
        };
    }

    public static Specification<User> hasRole(Role role) {
        return (root, query, cb) -> {
            if (role == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get(User_.role), role);
        };
    }

    public static Specification<User> hasUsername(String username) {
        return (root, query, cb) -> {
            if (username == null || username.isEmpty()) {
                return cb.conjunction();
            }
            return cb.like(cb.lower(root.get(User_.username)), "%" + username.toLowerCase() + "%");
        };
    }

    public static Specification<User> isActive(Boolean active) {
        return (root, query, cb) -> {
            if (active == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get(User_.active), active);
        };
    }

    public static Specification<User> withFilters(String email, Role role, String username, Boolean active) {
        List<Specification<User>> specifications = new ArrayList<>();

        if (email != null && !email.isEmpty()) {
            specifications.add(hasEmail(email));
        }
        if (role != null) {
            specifications.add(hasRole(role));
        }
        if (username != null && !username.isEmpty()) {
            specifications.add(hasUsername(username));
        }
        if (active != null) {
            specifications.add(isActive(active));
        }

        if (specifications.isEmpty()) {
            return (root, query, cb) -> cb.conjunction();
        }

        Specification<User> result = specifications.get(0);
        for (int i = 1; i < specifications.size(); i++) {
            result = result.and(specifications.get(i));
        }
        return result;
    }
}
