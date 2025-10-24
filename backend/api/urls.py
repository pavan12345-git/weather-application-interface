from django.urls import path
from . import views

urlpatterns = [
    # Health
    path('health/', views.health, name='health'),

    # Weather
    path('weather/current/', views.current_weather, name='current_weather'),
    path('weather/forecast/', views.forecast_weather, name='forecast_weather'),

    # Locations
    path('locations/search/', views.search_locations, name='search_locations'),
    path('locations/save/', views.save_location, name='save_location'),
    path('locations/', views.list_locations, name='list_locations'),
    path('locations/<int:location_id>/', views.delete_location, name='delete_location'),
    path('locations/<int:location_id>/favorite/', views.toggle_favorite, name='toggle_favorite'),

    # Preferences
    path('preferences/', views.get_preferences, name='get_preferences'),  # GET
    path('preferences/update/', views.update_preferences, name='update_preferences'),  # POST
]


