package com.mmea.mallos.mall.specification;

import com.mmea.mallos.mall.model.MallMember;
import com.mmea.mallos.mall.model.MallMember_;
import com.mmea.mallos.mall.model.enums.MallMemberRole;
import com.mmea.mallos.mall.model.enums.MallPermission;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.SetJoin;
import jakarta.persistence.criteria.JoinType;
import java.util.ArrayList;
import java.util.List;

public class MallMemberSpecification {

    public static Specification<MallMember> byMallId(Long mallId) {
        return (root, query, cb) -> {
            if (mallId == null) return cb.conjunction();
            return cb.equal(root.get(MallMember_.mall).get("id"), mallId);
        };
    }

    public static Specification<MallMember> byUserId(Long userId) {
        return (root, query, cb) -> {
            if (userId == null) return cb.conjunction();
            return cb.equal(root.get(MallMember_.user).get("id"), userId);
        };
    }

    public static Specification<MallMember> hasRole(MallMemberRole role) {
        return (root, query, cb) -> {
            if (role == null) return cb.conjunction();
            return cb.equal(root.get(MallMember_.role), role);
        };
    }

    public static Specification<MallMember> isActive(Boolean active) {
        return (root, query, cb) -> {
            if (active == null) return cb.conjunction();
            return cb.equal(root.get(MallMember_.isActive), active);
        };
    }

    public static Specification<MallMember> hasPermission(MallPermission permission) {
        return (root, query, cb) -> {
            if (permission == null) return cb.conjunction();
            // join to element collection 'permissions'
            SetJoin<MallMember, MallPermission> join = root.join(MallMember_.permissions, JoinType.LEFT);
            return cb.equal(join, permission);
        };
    }

    public static Specification<MallMember> withFilters(Long mallId, Long userId, MallMemberRole role, Boolean active, MallPermission permission) {
        List<Specification<MallMember>> specs = new ArrayList<>();
        if (mallId != null) specs.add(byMallId(mallId));
        if (userId != null) specs.add(byUserId(userId));
        if (role != null) specs.add(hasRole(role));
        if (active != null) specs.add(isActive(active));
        if (permission != null) specs.add(hasPermission(permission));

        if (specs.isEmpty()) return (root, query, cb) -> cb.conjunction();

        Specification<MallMember> result = specs.get(0);
        for (int i = 1; i < specs.size(); i++) result = result.and(specs.get(i));
        return result;
    }
}
