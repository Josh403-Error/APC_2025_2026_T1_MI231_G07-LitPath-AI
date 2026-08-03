from .system_logging import log_system_event


class SystemLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            response = self.get_response(request)
        except Exception as exc:
            try:
                log_system_event(request, response=None, exception=exc)
            except Exception:
                pass
            raise

        try:
            log_system_event(request, response=response)
        except Exception:
            pass

        return response
