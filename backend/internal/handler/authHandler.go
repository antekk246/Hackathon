package handler

import (
	"backend/internal/domain"
	"backend/internal/models"
	"backend/pkg/jwtutil"
	"encoding/json"
	"errors"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"gorm.io/gorm"
)

type AuthHandler struct {
	UserRepo    domain.UserRepository
	OauthConfig *oauth2.Config
}

func NewAuthHandler(repo domain.UserRepository, config *oauth2.Config) *AuthHandler {
	return &AuthHandler{
		UserRepo:    repo,
		OauthConfig: config,
	}
}

// User hits /api/v1/auth/google/login
func (h *AuthHandler) GoogleLogin(c *gin.Context) {
	url := h.OauthConfig.AuthCodeURL("random_state_string")
	c.Redirect(http.StatusTemporaryRedirect, url)
}
func (h *AuthHandler) GoogleCallback(c *gin.Context) {
	code := c.Query("code")
	token, err := h.OauthConfig.Exchange(c, code)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Błąd wymiany kodu"})
		return
	}

	// user data fetch
	client := h.OauthConfig.Client(c, token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v3/userinfo")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Błąd pobierania danych użytkownika"})
		return
	}
	defer resp.Body.Close()

	var googleUser struct {
		Sub   string `json:"sub"`
		Email string `json:"email"`
		Name  string `json:"name"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&googleUser); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Błąd dekodowania danych użytkownika"})
		return
	}

	user, err := h.UserRepo.GetByOAuthID(googleUser.Sub)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {

			user = &models.User{
				Username: googleUser.Name,
				Email:    googleUser.Email,
				OAuthID:  googleUser.Sub, // <-- TO ZAPOBIEGA BŁĘDOWI DUPLIKATU (ustawia unikalne ID zamiast pustego stringa "")
				Money:    900,            // (Opcjonalnie) Możesz dać graczowi trochę złota na start!
			}

			// Zapisujemy do bazy i sprawdzamy, czy zapis się powiódł
			if err := h.UserRepo.Create(user); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Nie udało się utworzyć konta użytkownika"})
				return
			}

		} else {
			// Jeśli to prawdziwy błąd bazy (np. zerwane połączenie)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Błąd bazy danych"})
			return
		}
	}
	// Generujemy Wasz token JWT
	appToken, err := jwtutil.GenerateToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Token generation failed"})
		return
	}

	// Dynamiczne przekierowanie: najpierw szukamy w środowisku, potem w Origin, na końcu default
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = c.Request.Header.Get("Origin")
	}
	if frontendURL == "" {
		frontendURL = "http://localhost:5173" // Fallback dla lokalnego dev
	}

	redirectURL := frontendURL + "/?token=" + appToken
	c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}
func (h *AuthHandler) GetMe(c *gin.Context) {
	// 1. Pobierz ID z kontekstu (ustawione przez middleware JWT)
	val, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Brak autoryzacji - zaloguj się ponownie"})
		return
	}

	// 2. Rzutowanie typu - middleware zazwyczaj przechowuje to jako uint lub float64 (z JSON)
	var userID uint
	switch v := val.(type) {
	case uint:
		userID = v
	case float64:
		userID = uint(v)
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Błędny format ID użytkownika"})
		return
	}

	// 3. Pobierz użytkownika korzystając z nowej metody Repo
	user, err := h.UserRepo.GetByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Użytkownik nie istnieje w bazie danych"})
		return
	}

	// 4. Sukces! Zwracamy obiekt użytkownika (Frontend dostanie Money i Cards)
	c.JSON(http.StatusOK, user)
}
