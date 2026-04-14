from rag_api.models import UserAccount; print('Total users:', UserAccount.objects.count()); [print(f'{u.id}: {u.email} ({u.role})') for u in UserAccount.objects.all()]
