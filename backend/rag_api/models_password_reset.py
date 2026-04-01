from django.db import models
import hashlib
from rag_api.models import UserAccount

class PasswordResetToken(models.Model):
    user = models.ForeignKey(UserAccount, on_delete=models.CASCADE)
    token = models.CharField(max_length=128, unique=True)
    expiry = models.DateTimeField()
    used = models.BooleanField(default=False)

    @staticmethod
    def hash_token(raw_token):
        return hashlib.sha256((raw_token or '').encode('utf-8')).hexdigest()

    @classmethod
    def find_unused_by_raw_token(cls, raw_token):
        if not raw_token:
            return None
        hashed = cls.hash_token(raw_token)
        token_obj = cls.objects.filter(token=hashed, used=False).first()
        if token_obj:
            return token_obj
        return cls.objects.filter(token=raw_token, used=False).first()

    def __str__(self):
        return f"PasswordResetToken(user={self.user_id}, token={self.token}, used={self.used})"
