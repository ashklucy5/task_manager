import sys
import http.client

def application(environ, start_response):
    method = environ['REQUEST_METHOD']
    path = environ.get('PATH_INFO', '/')
    query = environ.get('QUERY_STRING', '')
    if query:
        path = f"{path}?{query}"

    content_length = environ.get('CONTENT_LENGTH', '')
    content_length = int(content_length) if content_length else 0
    body = environ['wsgi.input'].read(content_length) if content_length > 0 else b''

    headers = {}
    for key, value in environ.items():
        if key.startswith('HTTP_'):
            header_name = key[5:].replace('_', '-').title()
            headers[header_name] = value
    if environ.get('CONTENT_TYPE'):
        headers['Content-Type'] = environ['CONTENT_TYPE']

    conn = http.client.HTTPConnection('127.0.0.1', 8001, timeout=30)
    try:
        conn.request(method, path, body=body, headers=headers)
        resp = conn.getresponse()
        resp_body = resp.read()
        resp_headers = [(k, v) for k, v in resp.getheaders() if k.lower() != 'transfer-encoding']
        start_response(f'{resp.status} {resp.reason}', resp_headers)
        return [resp_body]
    except Exception as e:
        start_response('502 Bad Gateway', [('Content-Type', 'text/plain')])
        return [f'Proxy error: {str(e)}'.encode()]
    finally:
        conn.close()