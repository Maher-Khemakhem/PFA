package tn.fst.authservice.service;

import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ListService {

    private static final List<String> COMPETENCES = Arrays.asList(
            "Java",
            "Python",
            "JavaScript",
            "TypeScript",
            "React",
            "Angular",
            "Vue.js",
            "Spring Boot",
            "Node.js",
            "Django",
            "Machine Learning",
            "Data Science",
            "Data Analysis",
            "DevOps",
            "Cloud Computing",
            "AWS",
            "Azure",
            "Docker",
            "Kubernetes",
            "CI/CD",
            "MySQL",
            "PostgreSQL",
            "MongoDB",
            "Redis",
            "Microservices",
            "REST API",
            "GraphQL",
            "Git",
            "Agile",
            "Scrum",
            "UI/UX Design",
            "Mobile Development",
            "Android",
            "iOS",
            "Flutter",
            "React Native",
            "Cybersecurity",
            "Blockchain",
            "IoT",
            "AI/ML",
            "Big Data"
    );

    private static final List<String> FACULTES = Arrays.asList(
            "Faculté des Sciences de Tunis",
            "Faculté des Sciences Économiques et de Gestion de Tunis",
            "Faculté de Médecine de Tunis",
            "Faculté de Droit et des Sciences Politiques de Tunis",
            "École Nationale d'Ingénieurs de Tunis",
            "Institut Supérieur de Gestion de Tunis",
            "École Supérieure des Sciences et Techniques de Tunis",
            "Institut Préparatoire aux Études d'Ingénieurs",
            "Faculté des Lettres et des Sciences Humaines de Tunis",
            "École Nationale des Sciences de l'Informatique",
            "Institut Supérieur d'Informatique",
            "Faculté des Sciences Juridiques, Politiques et Sociales de Tunis"
    );

    private static final Map<String, List<String>> SPECIALITES_BY_FACULTE = createSpecialites();

    public List<String> getCompetences() {
        return COMPETENCES;
    }

    public List<String> getFacultes() {
        return FACULTES;
    }

    public Map<String, List<String>> getSpecialites() {
        return SPECIALITES_BY_FACULTE;
    }

    private static Map<String, List<String>> createSpecialites() {
        Map<String, List<String>> specialites = new LinkedHashMap<>();
        specialites.put("Faculté des Sciences de Tunis", Arrays.asList(
                "Informatique",
                "Mathématiques",
                "Physique",
                "Chimie",
                "Biologie",
                "Géologie"
        ));
        specialites.put("Faculté des Sciences Économiques et de Gestion de Tunis", Arrays.asList(
                "Gestion",
                "Finance",
                "Comptabilité",
                "Marketing",
                "Économie"
        ));
        specialites.put("Faculté de Médecine de Tunis", Arrays.asList(
                "Médecine générale",
                "Pharmacie",
                "Sciences infirmières"
        ));
        specialites.put("Faculté de Droit et des Sciences Politiques de Tunis", Arrays.asList(
                "Droit privé",
                "Droit public",
                "Sciences politiques"
        ));
        specialites.put("École Nationale d'Ingénieurs de Tunis", Arrays.asList(
                "Génie informatique",
                "Génie civil",
                "Génie électrique",
                "Génie industriel",
                "Génie mécanique"
        ));
        specialites.put("Institut Supérieur de Gestion de Tunis", Arrays.asList(
                "Management",
                "Business Intelligence",
                "Finance",
                "Marketing digital"
        ));
        specialites.put("École Supérieure des Sciences et Techniques de Tunis", Arrays.asList(
                "Technologies de l'information",
                "Télécommunications",
                "Électronique",
                "Automatique"
        ));
        specialites.put("Institut Préparatoire aux Études d'Ingénieurs", Arrays.asList(
                "Mathématiques-Physique",
                "Physique-Chimie",
                "Technologie"
        ));
        specialites.put("Faculté des Lettres et des Sciences Humaines de Tunis", Arrays.asList(
                "Langues",
                "Littérature",
                "Histoire",
                "Philosophie",
                "Sociologie"
        ));
        specialites.put("École Nationale des Sciences de l'Informatique", Arrays.asList(
                "Génie logiciel",
                "Intelligence artificielle",
                "Réseaux et sécurité",
                "Systèmes d'information",
                "Data Science"
        ));
        specialites.put("Institut Supérieur d'Informatique", Arrays.asList(
                "Développement logiciel",
                "Systèmes embarqués",
                "Réseaux informatiques",
                "Multimédia"
        ));
        specialites.put("Faculté des Sciences Juridiques, Politiques et Sociales de Tunis", Arrays.asList(
                "Droit",
                "Relations internationales",
                "Sciences sociales"
        ));
        return specialites;
    }
}
