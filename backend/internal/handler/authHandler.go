package handler

import (
	"backend/internal/domain"
	"backend/pkg/jwtutil"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
)

type AuthHandler struct {
	UserRepo    domain.UserRepository
	OauthConfig *oauth2.Config
}

// 1. User hits /api/v1/auth/google/login
func (h *AuthHandler) GoogleLogin(c *gin.Context) {
	url := h.OauthConfig.AuthCodeURL("random_state_string")
	c.Redirect(http.StatusTemporaryRedirect, url)
}

// 2. Google redirects back to /api/v1/auth/google/callback
func (h *AuthHandler) GoogleCallback(c *gin.Context) {
	code := c.Query("code")

	// Exchange code for token
	token, err := h.OauthConfig.Exchange(c, code)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Exchange failed"})
		return
	}

	// Use token to get User Info from Google API (email, name, sub)
	// ... (fetch from https://www.googleapis.com/oauth2/v3/userinfo)

	// Check if user exists in DB via OAuthID; if not, create them.
	// Finally, generate YOUR OWN JWT for your app's session.
	appToken, _ := jwtutil.GenerateToken(dbUser.ID)
	c.JSON(http.StatusOK, gin.H{"token": appToken})
}
