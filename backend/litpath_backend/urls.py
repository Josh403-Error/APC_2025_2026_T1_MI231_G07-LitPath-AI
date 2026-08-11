"""
URL configuration for litpath_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.views.generic import TemplateView
import os
from django.conf import settings
from django.http import HttpResponse

def health_check(request):
    return JsonResponse({"status": "ok"})

# View to serve the built React app's index.html
def serve_react_app(request, route=''):
    # Define the path to the built index.html
    index_path = os.path.join(settings.STATIC_ROOT or os.path.join(settings.BASE_DIR, 'staticfiles'), 'index.html')
    try:
        with open(index_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return HttpResponse(content, content_type='text/html')
    except FileNotFoundError:
        return HttpResponse("Frontend application not found. Please build the frontend.", status=500)

urlpatterns = [
    # path('', health_check, name='health'),  # Removed to allow React app to serve at root
    path('admin/', admin.site.urls),
    path('api/', include('rag_api.urls')),
    # Serve the React app for root and search paths
    path('', serve_react_app, name='home'),
    path('search/', serve_react_app, name='search'),
    # Catch-all for other frontend routes handled by React Router
    path('<path:route>/', serve_react_app, name='frontend_routes'),
]