from rest_framework.views import exception_handler
from rest_framework.exceptions import ValidationError, AuthenticationFailed, NotAuthenticated, PermissionDenied, NotFound

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        code = "GENERIC_ERROR"
        message = "Ocurrió un error al procesar la solicitud."
        fields = {}

        if isinstance(exc, ValidationError):
            code = "VALIDATION_ERROR"
            message = "Los datos enviados no son válidos."
            if isinstance(response.data, dict):
                fields = response.data
            elif isinstance(response.data, list):
                fields = {"non_field_errors": response.data}
        elif isinstance(exc, (AuthenticationFailed, NotAuthenticated)):
            code = "AUTHENTICATION_FAILED"
            message = getattr(exc, 'detail', "Credenciales de autenticación no válidas o no proporcionadas.")
            if isinstance(message, dict):
                message = message.get('detail', str(message))
        elif isinstance(exc, PermissionDenied):
            code = "PERMISSION_DENIED"
            message = getattr(exc, 'detail', "No tiene permisos para realizar esta acción.")
            if isinstance(message, dict):
                message = message.get('detail', str(message))
        elif isinstance(exc, NotFound):
            code = "NOT_FOUND"
            message = getattr(exc, 'detail', "El recurso solicitado no fue encontrado.")
            if isinstance(message, dict):
                message = message.get('detail', str(message))
        else:
            if isinstance(response.data, dict) and 'detail' in response.data:
                message = str(response.data['detail'])

        formatted_data = {
            "error": {
                "code": code,
                "message": str(message),
            }
        }
        if fields:
            formatted_data["error"]["fields"] = fields

        response.data = formatted_data

    return response
