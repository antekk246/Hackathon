package database

import (
	"backend/internal/models"
	"fmt"
	"log"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// Seed fills the database with static game data and test instances.
func Seed(db *gorm.DB) error {
	log.Println("Starting database seeding...")

	// 1. Seed Card Types
	cardTypes := []models.CardType{
		{Name: "Attack"},
		{Name: "Skill"},
		{Name: "Power"},
	}
	for i := range cardTypes {
		if err := db.Where("name = ?", cardTypes[i].Name).FirstOrCreate(&cardTypes[i]).Error; err != nil {
			return fmt.Errorf("error seeding card type: %w", err)
		}
	}

	// 2. Create Upgraded Cards (So we can link base cards to them)
	strikePlus := models.Card{
		Name:        "Strike+",
		TypeID:      &cardTypes[0].ID,
		Description: "Zadaj 9 obrażeń.",
		UpgradeCost: 0,
		CardAction:  datatypes.JSON([]byte(`{"action": "damage", "value": 9}`)),
	}
	db.Where("name = ?", strikePlus.Name).FirstOrCreate(&strikePlus)

	defendPlus := models.Card{
		Name:        "Defend+",
		TypeID:      &cardTypes[1].ID,
		Description: "Zyskaj 8 pancerza.",
		UpgradeCost: 0,
		CardAction:  datatypes.JSON([]byte(`{"action": "block", "value": 8}`)),
	}
	db.Where("name = ?", defendPlus.Name).FirstOrCreate(&defendPlus)

	// 3. Seed Base Cards
	baseCards := []models.Card{
		{
			Name:        "Strike",
			TypeID:      &cardTypes[0].ID,
			Description: "Zadaj 6 obrażeń.",
			UpgradeCost: 50,
			UpgradeToID: &strikePlus.ID,
			CardAction:  datatypes.JSON([]byte(`{"action": "damage", "value": 6}`)),
		},
		{
			Name:        "Defend",
			TypeID:      &cardTypes[1].ID,
			Description: "Zyskaj 5 pancerza.",
			UpgradeCost: 50,
			UpgradeToID: &defendPlus.ID,
			CardAction:  datatypes.JSON([]byte(`{"action": "block", "value": 5}`)),
		},
		{
			Name:        "Fireball",
			TypeID:      &cardTypes[0].ID,
			Description: "Zadaj 12 obrażeń. Koszt: 2 Energii.",
			UpgradeCost: 100,
			CardAction:  datatypes.JSON([]byte(`{"action": "damage", "value": 12, "cost": 2}`)),
		},
	}
	for i := range baseCards {
		if err := db.Where("name = ?", baseCards[i].Name).FirstOrCreate(&baseCards[i]).Error; err != nil {
			return fmt.Errorf("error seeding base card: %w", err)
		}
	}

	// 4. Seed Enemies
	enemies := []models.Enemy{
		{EnemyLevel: 1, IsBoss: false, EnemyContent: datatypes.JSON([]byte(`{"name": "Green Slime", "hp": 20, "dmg": 3}`))},
		{EnemyLevel: 2, IsBoss: false, EnemyContent: datatypes.JSON([]byte(`{"name": "Angry Rat", "hp": 15, "dmg": 5}`))},
		{EnemyLevel: 3, IsBoss: true, EnemyContent: datatypes.JSON([]byte(`{"name": "Slime King", "hp": 120, "dmg": 10, "ability": "split"}`))},
	}
	for _, e := range enemies {
		db.Where("enemy_content = ?", e.EnemyContent).FirstOrCreate(&e)
	}

	// 5. Seed Rewards & Events
	reward1 := models.Reward{RewardLevel: 1, RewardContent: datatypes.JSON([]byte(`{"gold": 50, "msg": "Found a pouch!"}`))}
	db.Where("reward_content = ?", reward1.RewardContent).FirstOrCreate(&reward1)

	event1 := models.Event{
		RewardID:    &reward1.ID,
		CardsOnHand: datatypes.JSON([]byte(`{"title": "Old Camp", "desc": "Something shines in the ashes."}`)),
	}
	db.Where("cards_on_hand = ?", event1.CardsOnHand).FirstOrCreate(&event1)

	// --- DUPLICATE & TEST USER SECTION ---

	// 6. Create/Find Test User
	testUser := models.User{
		Username: "TestPlayer",
		Email:    "test@example.com",
		OAuthID:  "test-oauth-id-123",
		Money:    1000, // Give them plenty of money for testing upgrades
	}
	if err := db.Where("email = ?", testUser.Email).FirstOrCreate(&testUser).Error; err != nil {
		return fmt.Errorf("error seeding test user: %w", err)
	}

	// 7. Clear old inventory for this user (to ensure fresh test state)
	db.Where("user_id = ?", testUser.ID).Delete(&models.UserCard{})

	// 8. Give the user duplicates (Instances)
	// We are manually creating rows in the 'user_cards' join table
	userInventory := []models.UserCard{
		{UserID: testUser.ID, CardID: baseCards[0].ID}, // Strike #1 (InstanceID will be unique)
		{UserID: testUser.ID, CardID: baseCards[0].ID}, // Strike #2 (Duplicate)
		{UserID: testUser.ID, CardID: baseCards[2].ID}, // Fireball #1
		{UserID: testUser.ID, CardID: baseCards[2].ID}, // Fireball #2 (Duplicate)
	}

	for _, uc := range userInventory {
		if err := db.Create(&uc).Error; err != nil {
			log.Printf("Failed to create card instance: %v", err)
		}
	}

	log.Printf("Seeding complete! User '%s' has %d cards ready for duplicate/upgrade testing.", testUser.Username, len(userInventory))
	return nil
}
