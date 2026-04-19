package database

import (
	"backend/internal/models"
	"log"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

func Seed(db *gorm.DB) error {
	log.Println("Rozpoczynanie seedowania bazy danych edukacyjnej gry finansowej...")

	// 1. Kategorie kart (TypeID) - MUSZĄ BYĆ ZDEFINIOWANE NA POCZĄTKU
	cardTypes := []models.CardType{
		{Name: "Finanse (Atak)"},          // index 0
		{Name: "Bezpieczeństwo (Obrona)"}, // index 1
		{Name: "Strategia (Utility)"},     // index 2
	}
	for i := range cardTypes {
		db.Where("name = ?", cardTypes[i].Name).FirstOrCreate(&cardTypes[i])
	}
	// --- 2. DEFINICJA KART ULEPSZONYCH (LEVEL 2) ---
	// Tworzymy je najpierw, żeby móc do nich referować
	upgradedCards := []models.Card{
		{
			Name:        "Super Gotówka|Super Cash",
			TypeID:      &cardTypes[0].ID,
			Description: "Spłacasz 80 PLN problemu.",
			CardAction:  datatypes.JSON([]byte(`{"action": "damage", "value": 80}`)),
		},
		{
			Name:        "Konto Premium|Premium Account",
			TypeID:      &cardTypes[1].ID,
			Description: "Zyskaj 80 PLN Poduszki Finansowej.",
			CardAction:  datatypes.JSON([]byte(`{"action": "block", "value": 80}`)),
		},
		{
			Name:        "Analiza Rynkowa",
			TypeID:      &cardTypes[2].ID,
			Description: "Dobierz 3 karty.",
			CardAction:  datatypes.JSON([]byte(`{"action": "draw", "value": 3}`)),
		},
		{
			Name:        "Przelew Natychmiastowy",
			TypeID:      &cardTypes[0].ID,
			Description: "Natychmiast spłacasz 120 PLN długu.",
			CardAction:  datatypes.JSON([]byte(`{"action": "damage", "value": 120}`)),
		},
	}

	for i := range upgradedCards {
		db.Where("name = ?", upgradedCards[i].Name).FirstOrCreate(&upgradedCards[i])
	}

	// --- 3. DEFINICJA KART PODSTAWOWYCH I DROGICH ---
	cards := []models.Card{
		// Zestaw podstawowy z przypisanymi ulepszeniami
		{
			Name:        "Gotówka|Cash",
			TypeID:      &cardTypes[0].ID,
			Description: "Spłacasz 50 PLN problemu.",
			CardAction:  datatypes.JSON([]byte(`{"action": "damage", "value": 50}`)),
			UpgradeToID: &upgradedCards[0].ID, // Super Gotówka
			UpgradeCost: 100,
		},
		{
			Name:        "Konto Oszczędnościowe|Savings Account",
			TypeID:      &cardTypes[1].ID,
			Description: "Zyskaj 50 PLN Poduszki Finansowej.",
			CardAction:  datatypes.JSON([]byte(`{"action": "block", "value": 50}`)),
			UpgradeToID: &upgradedCards[1].ID, // Konto Premium
			UpgradeCost: 100,
		},
		{
			Name:        "Szybka Analiza",
			TypeID:      &cardTypes[2].ID,
			Description: "Dobierz 2 karty.",
			CardAction:  datatypes.JSON([]byte(`{"action": "draw", "value": 2}`)),
			UpgradeToID: &upgradedCards[2].ID, // Analiza Rynkowa
			UpgradeCost: 100,
		},
		{
			Name:        "Przelew Ekspresowy",
			TypeID:      &cardTypes[0].ID,
			Description: "Natychmiast spłacasz 80 PLN długu.",
			CardAction:  datatypes.JSON([]byte(`{"action": "damage", "value": 80}`)),
			UpgradeToID: &upgradedCards[3].ID, // Przelew Natychmiastowy
			UpgradeCost: 100,
		},
		
		// --- DROGIE KARTY (ELITARNE) ZE SCREENA ---
		{
			Name:        "Złoty Certyfikat PKO",
			TypeID:      &cardTypes[0].ID,
			Description: "Potężne uderzenie kapitałem. Zadaje 200 PLN obrażeń.",
			CardAction:  datatypes.JSON([]byte(`{"action": "damage", "value": 200}`)),
		},
		{
			Name:        "Tarcza Antyinflacyjna",
			TypeID:      &cardTypes[1].ID,
			Description: "Zyskaj 200 PLN Poduszki Finansowej.",
			CardAction:  datatypes.JSON([]byte(`{"action": "block", "value": 200}`)),
		},
		{
			Name:        "Dźwignia Finansowa",
			TypeID:      &cardTypes[2].ID,
			Description: "Zadaj 100 PLN obrażeń i zyskaj +1 Akcję.",
			CardAction:  datatypes.JSON([]byte(`{"action": "multi", "damage": 100, "energy": 1}`)),
		},

		// Pozostałe Twoje karty dodatkowe (zachowane)
		{
			Name:        "Porada Eksperta",
			TypeID:      &cardTypes[2].ID,
			Description: "Zyskaj +1 Akcję i 30 PLN Poduszki. (Wyczerpanie)",
			CardAction:  datatypes.JSON([]byte(`{"action": "multi", "energy": 1, "block": 30, "exhaust": true}`)),
		},
		{
			Name:        "Lokata Terminowa",
			TypeID:      &cardTypes[1].ID,
			Description: "Zyskaj 120 PLN Poduszki. Koszt: 2 Akcje.",
			CardAction:  datatypes.JSON([]byte(`{"action": "block", "value": 120, "cost": 2}`)),
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
