from django.contrib import admin
from .models import Category, Website

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon', 'order', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name']

@admin.register(Website)
class WebsiteAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'url', 'order', 'clicks', 'is_active', 'created_at']
    list_filter = ['category', 'is_active']
    search_fields = ['name', 'url', 'description']