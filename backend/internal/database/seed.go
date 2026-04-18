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
	// 2. Definicja kart (Simplified: Attack, Defend, Draw)
	cards := []models.Card{
		// --- ZESTAW PODSTAWOWY (STARTOWY) ---
		{
			Name:        "Gotówka|Cash",
			TypeID:      &cardTypes[0].ID,
			Description: "Atak za 50 PLN.",
			CardAction:  datatypes.JSON([]byte(`{"action": "attack", "value": 50}`)),
		},
		{
			Name:        "Konto Oszczędnościowe",
			TypeID:      &cardTypes[1].ID,
			Description: "Zyskaj 50 PLN Obrony.",
			CardAction:  datatypes.JSON([]byte(`{"action": "defend", "value": 50}`)),
		},
		{
			Name:        "Szybka Analiza",
			TypeID:      &cardTypes[2].ID,
			Description: "Dobierz 2 karty.",
			CardAction:  datatypes.JSON([]byte(`{"action": "draw", "value": 2}`)),
		},

		// --- KARTY DODATKOWE ---
		{
			Name:        "Przelew Ekspresowy",
			TypeID:      &cardTypes[0].ID,
			Description: "Mocny atak za 80 PLN.",
			CardAction:  datatypes.JSON([]byte(`{"action": "attack", "value": 80}`)),
		},
		{
			Name:        "Lokata Terminowa",
			TypeID:      &cardTypes[1].ID,
			Description: "Zyskaj 120 PLN Obrony.",
			CardAction:  datatypes.JSON([]byte(`{"action": "defend", "value": 120}`)),
		},
		{
			Name:        "Inwestycja w Wiedzę",
			TypeID:      &cardTypes[2].ID,
			Description: "Dobierz 3 karty.",
			CardAction:  datatypes.JSON([]byte(`{"action": "draw", "value": 3}`)),
		},
		{
			Name:        "Płatność Blik",
			TypeID:      &cardTypes[0].ID,
			Description: "Szybki atak za 40 PLN.",
			CardAction:  datatypes.JSON([]byte(`{"action": "attack", "value": 40}`)),
		},
		{
			Name:        "Fundusz Awaryjny",
			TypeID:      &cardTypes[1].ID,
			Description: "Zyskaj 80 PLN Obrony.",
			CardAction:  datatypes.JSON([]byte(`{"action": "defend", "value": 80}`)),
		},
		{
			Name:        "Dywersyfikacja",
			TypeID:      &cardTypes[0].ID,
			Description: "Atak za 60 PLN.",
			CardAction:  datatypes.JSON([]byte(`{"action": "attack", "value": 60}`)),
		},
		{
			Name:        "Weryfikacja Dwuskładnikowa",
			TypeID:      &cardTypes[1].ID,
			Description: "Zyskaj 40 PLN Obrony.",
			CardAction:  datatypes.JSON([]byte(`{"action": "defend", "value": 40}`)),
		},
		{
			Name:        "Budżet Domowy",
			TypeID:      &cardTypes[2].ID,
			Description: "Dobierz 1 kartę.",
			CardAction:  datatypes.JSON([]byte(`{"action": "draw", "value": 1}`)),
		},
		{
			Name:        "Zwrot Podatku",
			TypeID:      &cardTypes[0].ID,
			Description: "Atak za 100 PLN.",
			CardAction:  datatypes.JSON([]byte(`{"action": "attack", "value": 100}`)),
		},
		{
			Name:        "Asystent AI",
			TypeID:      &cardTypes[2].ID,
			Description: "Dobierz 4 karty.",
			CardAction:  datatypes.JSON([]byte(`{"action": "draw", "value": 4}`)),
		},
		{
			Name:        "Aplikacja Mobilna IKO",
			TypeID:      &cardTypes[1].ID,
			Description: "Zyskaj 70 PLN Obrony.",
			CardAction:  datatypes.JSON([]byte(`{"action": "defend", "value": 70}`)),
		},
		{
			Name:        "Premia Kwartalna",
			TypeID:      &cardTypes[0].ID,
			Description: "Atak za 150 PLN.",
			CardAction:  datatypes.JSON([]byte(`{"action": "attack", "value": 150}`)),
		},
	}

	for i := range cards {
		db.Where("name = ?", cards[i].Name).FirstOrCreate(&cards[i])
	}
	enemies := []models.Enemy{
		{
			EnemyLevel: 1,
			IsBoss:     false,
			BaseHealth: 150, // <-- Dodane dla łatwiejszego inicjowania walki!
			EnemyContent: datatypes.JSON([]byte(`{
                "name": "Fałszywy SMS", 
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
