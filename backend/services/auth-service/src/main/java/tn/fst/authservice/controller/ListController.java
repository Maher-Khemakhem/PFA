package tn.fst.authservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.fst.authservice.service.ListService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/lists")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ListController {

    private final ListService listService;

    @GetMapping("/competences")
    public ResponseEntity<List<String>> getCompetences() {
        List<String> competences = listService.getCompetences();
        return ResponseEntity.ok(competences);
    }

    @GetMapping("/facultes")
    public ResponseEntity<List<String>> getFacultes() {
        List<String> facultes = listService.getFacultes();
        return ResponseEntity.ok(facultes);
    }

    @GetMapping("/specialites")
    public ResponseEntity<Map<String, List<String>>> getSpecialites() {
        return ResponseEntity.ok(listService.getSpecialites());
    }
}
