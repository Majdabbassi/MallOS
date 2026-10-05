package com.mmea.mallos.mall.specification;

import com.mmea.mallos.mall.model.Mall;
import com.mmea.mallos.mall.model.Mall_;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class MallSpecification {

    public static Specification<Mall> byId(Long id) {
        return (root, query, cb) -> {
            if (id == null) return cb.conjunction();
            return cb.equal(root.get(Mall_.id), id);
        };
    }

    public static Specification<Mall> byName(String name) {
        return (root, query, cb) -> {
            if (name == null || name.isEmpty()) return cb.conjunction();
            return cb.like(cb.lower(root.get(Mall_.name)), "%" + name.toLowerCase() + "%");
        };
    }

    public static Specification<Mall> byCompanyName(String companyName) {
        return (root, query, cb) -> {
            if (companyName == null || companyName.isEmpty()) return cb.conjunction();
            return cb.like(cb.lower(root.get(Mall_.companyName)), "%" + companyName.toLowerCase() + "%");
        };
    }

    public static Specification<Mall> byCreatedBy(Long userId) {
        return (root, query, cb) -> {
            if (userId == null) return cb.conjunction();
            return cb.equal(root.get(Mall_.createdBy).get("id"), userId);
        };
    }

    public static Specification<Mall> withFilters(Long id, String name, String companyName, Long createdBy) {
        List<Specification<Mall>> specs = new ArrayList<>();
        if (id != null) specs.add(byId(id));
        if (name != null && !name.isEmpty()) specs.add(byName(name));
        if (companyName != null && !companyName.isEmpty()) specs.add(byCompanyName(companyName));
        if (createdBy != null) specs.add(byCreatedBy(createdBy));

        if (specs.isEmpty()) return (root, query, cb) -> cb.conjunction();

        Specification<Mall> result = specs.get(0);
        for (int i = 1; i < specs.size(); i++) result = result.and(specs.get(i));
        return result;
    }
}
