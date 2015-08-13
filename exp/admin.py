from django.contrib import admin

# Register your models here.

from .models import Session, Report

admin.site.register(Session)
admin.site.register(Report)
