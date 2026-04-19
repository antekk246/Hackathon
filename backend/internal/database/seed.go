package database

import (
	"backend/internal/models"
	"log"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

func Seed(db *gorm.DB) error {
	log.Println("Rozpoczynanie seedowania bazy danych edukacyjnej gry finansowej...")

	// 1. Kategorie kart (TypeID)
	cardTypes := []models.CardType{
		{Name: "Finanse (Atak)"},          // Karty rozwiązujące dług/problem
		{Name: "Bezpieczeństwo (Obrona)"}, // Karty budujące poduszkę
		{Name: "Strategia (Utility)"},     // Dobieranie kart, dodatkowe akcje
	}
	for i := range cardTypes {
		db.Where("name = ?", cardTypes[i].Name).FirstOrCreate(&cardTypes[i])
	}

	// 2. Definicja kart (Podstawowe + Dodatkowe do 15 sztuk)
	// UWAGA: UpgradeToID można dodać analogicznie jak w poprzednim przykładzie
	cards := []models.Card{
		// --- ZESTAW PODSTAWOWY (STARTOWY) ---
		{
			Name:        "Gotówka|Cash",
			TypeID:      &cardTypes[0].ID,
			Description: "Spłacasz 50 PLN problemu.",
			CardAction:  datatypes.JSON([]byte(`{"action": "damage", "value": 50}`)),
		},
		{
			Name:        "Konto Oszczędnościowe|Savings Account",
			TypeID:      &cardTypes[1].ID,
			Description: "Zyskaj 50 PLN Poduszki Finansowej.",
			CardAction:  datatypes.JSON([]byte(`{"action": "block", "value": 50}`)),
		},
		{
			Name:        "Szybka Analiza",
			TypeID:      &cardTypes[2].ID,
			Description: "Dobierz 2 karty.",
			CardAction:  datatypes.JSON([]byte(`{"action": "draw", "value": 2}`)),
		},
		{
			Name:        "Porada Eksperta",
			TypeID:      &cardTypes[2].ID,
			Description: "Zyskaj +1 Akcję i 30 PLN Poduszki. (Wyczerpanie)",
			CardAction:  datatypes.JSON([]byte(`{"action": "multi", "energy": 1, "block": 30, "exhaust": true}`)),
		},

		// --- KARTY DODATKOWE (DO ZDOBYCIA/KUPNA) ---
		{
			Name:        "Lokata Terminowa",
			TypeID:      &cardTypes[1].ID,
			Description: "Zyskaj 120 PLN Poduszki. Koszt: 2 Akcje.",
			CardAction:  datatypes.JSON([]byte(`{"action": "block", "value": 120, "cost": 2}`)),
		},
		{
			Name:        "Przelew Ekspresowy",
			TypeID:      &cardTypes[0].ID,
			Description: "Natychmiast spłacasz 80 PLN długu.",
			CardAction:  datatypes.JSON([]byte(`{"action": "damage", "value": 80}`)),
		},
		{
			Name:        "Budżet Domowy",
			TypeID:      &cardTypes[2].ID,
			Description: "W tej turze wszystkie karty 'Gotówka' są o 20% skuteczniejsze.",
			CardAction:  datatypes.JSON([]byte(`{"action": "buff_cash", "value": 1.2}`)),
		},
		{
			Name:        "Inwestycja w Wiedzę",
			TypeID:      &cardTypes[2].ID,
			Description: "Dobierz 3 karty. Odrzuć 1.",
			CardAction:  datatypes.JSON([]byte(`{"action": "draw_discard", "draw": 3, "discard": 1}`)),
		},
		{
			Name:        "Weryfikacja Dwuskładnikowa",
			TypeID:      &cardTypes[1].ID,
			Description: "Zyskaj 40 PLN Poduszki. Następny atak wroga jest o 50% słabszy.",
			CardAction:  datatypes.JSON([]byte(`{"action": "block_weaken", "value": 40}`)),
		},
		{
			Name:        "Zwrot Podatku",
			TypeID:      &cardTypes[0].ID,
			Description: "Zadaj 150 PLN obrażeń. (Można użyć tylko jeśli masz >200 PLN Poduszki).",
			CardAction:  datatypes.JSON([]byte(`{"action": "conditional_damage", "value": 150, "req": 200}`)),
		},
		{
			Name:        "Aplikacja Mobilna IKO",
			TypeID:      &cardTypes[2].ID,
			Description: "Zmniejsz koszt następnej karty w tej turze do 0.",
			CardAction:  datatypes.JSON([]byte(`{"action": "reduce_cost"}`)),
		},
		{
			Name:        "Fundusz Awaryjny",
			TypeID:      &cardTypes[1].ID,
			Description: "Zmień całą posiadaną Gotówkę na ręce w Poduszkę (1:1).",
			CardAction:  datatypes.JSON([]byte(`{"action": "convert_hand"}`)),
		},
		{
			Name:        "Dywersyfikacja",
			TypeID:      &cardTypes[2].ID,
			Description: "Zadaj 40 obrażeń i zyskaj 40 Poduszki.",
			CardAction:  datatypes.JSON([]byte(`{"action": "hybrid", "dmg": 40, "block": 40}`)),
		},
		{
			Name:        "Asystent AI",
			TypeID:      &cardTypes[2].ID,
			Description: "Podejrzyj 3 pierwsze karty z talii. Wybierz jedną na rękę.",
			CardAction:  datatypes.JSON([]byte(`{"action": "scry", "value": 3}`)),
		},
		{
			Name:        "Płatność Blik",
			TypeID:      &cardTypes[0].ID,
			Description: "Szybki atak za 40. Jeśli to wykończy wroga, dobierz kartę.",
			CardAction:  datatypes.JSON([]byte(`{"action": "execute", "value": 40}`)),
		},
	}

	for i := range cards {
		db.Where("name = ?", cards[i].Name).FirstOrCreate(&cards[i])
	}

	// 3. Przeciwnicy (Zgodnie z Twoją specyfikacją)
	enemies := []models.Enemy{
		{
			EnemyLevel: 1,
			IsBoss:     false,
			BaseHealth: 150,
			EnemyContent: datatypes.JSON([]byte(`{
                "name": "Fałszywy SMS", 
                "hp": 150, 
                "dmg": 40, 
                "desc": "Próbuje wyłudzić drobne kwoty."
            }`)),
		},
		{
			EnemyLevel: 2,
			IsBoss:     false,
			BaseHealth: 350,
			EnemyContent: datatypes.JSON([]byte(`{
                "name": "Nagła Naprawa Roweru", 
                "hp": 350, 
                "dmg": 120, 
                "pattern": "strong_attack_then_cooldown"
            }`)),
		},
		{
			EnemyLevel: 3,
			IsBoss:     true,
			BaseHealth: 600,
			EnemyContent: datatypes.JSON([]byte(`{
                "name": "Nieuczciwy Sprzedawca", 
                "hp": 600,
                "dmg": 60, 
                "special": "Ukryta Opłata (Trash Card)"
            }`)),
		},
	}

	for i := range enemies {
		db.Where("enemy_content = ?", enemies[i].EnemyContent).FirstOrCreate(&enemies[i])
	}

	// 4. SCENARIUSZE WALK (Encounters)
	encounters := []models.Encounter{
		{
			Level:       1,
			IsBoss:      false,
			Description: "Podejrzany SMS - standardowa próba phishingu.",
			EnemyID:     enemies[0].ID,
		},
		{
			Level:       2,
			IsBoss:      false,
			Description: "Awarie się zdarzają. Trzeba zapłacić.",
			EnemyID:     enemies[1].ID,
		},
		{
			Level:       3,
			IsBoss:      true,
			Description: "Walka z Bossem: Staroszkolny handlarz.",
			EnemyID:     enemies[2].ID,
		},
	}
	for i := range encounters {
		db.Where("description = ?", encounters[i].Description).FirstOrCreate(&encounters[i])
	}

	// 4. Testowy użytkownik z talii startowej (10 kart)
	testUser := models.User{
		Username: "StudentPKO",
		Email:    "student@pko.pl",
		Money:    500,
	}
	db.Where("email = ?", testUser.Email).FirstOrCreate(&testUser)

	// Czyszczenie starej talii
	db.Where("user_id = ?", testUser.ID).Delete(&models.UserCard{})

	// Budowanie talii 10 kart: 4x Gotówka, 4x Konto, 1x Analiza, 1x Porada
	starterDeck := []struct {
		name  string
		count int
	}{
		{"Gotówka", 4},
		{"Konto Oszczędnościowe", 4},
		{"Szybka Analiza", 1},
		{"Porada Eksperta", 1},
	}

	for _, entry := range starterDeck {
		var card models.Card
		db.Where("name = ?", entry.name).First(&card)
		for i := 0; i < entry.count; i++ {
			db.Create(&models.UserCard{UserID: testUser.ID, CardID: card.ID})
		}
	}

	log.Println("Seedowanie zakończone sukcesem!")
	return nil
}
