'''
Business: Manage pins - create, list, get, update views
Args: event - dict with httpMethod, body, queryStringParameters
      context - object with request_id attribute
Returns: HTTP response with pins data or error
'''

import json
import os
import psycopg2
from typing import Dict, Any, List

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        search = params.get('search', '')
        sort_by = params.get('sort', 'newest')
        
        query = """
            SELECT p.id, p.title, p.content, p.views, p.created_at, 
                   u.username, u.id as author_id,
                   (SELECT COUNT(*) FROM comments WHERE pin_id = p.id) as comment_count
            FROM pins p
            JOIN users u ON p.author_id = u.id
            WHERE p.title ILIKE %s
        """
        
        if sort_by == 'views':
            query += " ORDER BY p.views DESC"
        elif sort_by == 'oldest':
            query += " ORDER BY p.created_at ASC"
        else:
            query += " ORDER BY p.created_at DESC"
        
        cur.execute(query, (f'%{search}%',))
        pins = cur.fetchall()
        
        result = []
        for pin in pins:
            result.append({
                'id': pin[0],
                'title': pin[1],
                'content': pin[2],
                'views': pin[3],
                'date': pin[4].isoformat(),
                'author': pin[5],
                'author_id': pin[6],
                'comment_count': pin[7]
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'pins': result}),
            'isBase64Encoded': False
        }
    
    elif method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        title = body_data.get('title', '').strip()
        content = body_data.get('content', '').strip()
        author_id = body_data.get('author_id')
        
        if not title or not content or not author_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Title, content and author_id are required'}),
                'isBase64Encoded': False
            }
        
        cur.execute(
            """INSERT INTO pins (title, content, author_id) 
               VALUES (%s, %s, %s) 
               RETURNING id, title, content, views, created_at""",
            (title, content, author_id)
        )
        pin = cur.fetchone()
        conn.commit()
        
        cur.execute("SELECT username FROM users WHERE id = %s", (author_id,))
        author = cur.fetchone()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'id': pin[0],
                'title': pin[1],
                'content': pin[2],
                'views': pin[3],
                'date': pin[4].isoformat(),
                'author': author[0] if author else 'Unknown',
                'author_id': author_id
            }),
            'isBase64Encoded': False
        }
    
    elif method == 'PUT':
        body_data = json.loads(event.get('body', '{}'))
        pin_id = body_data.get('pin_id')
        
        if not pin_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'pin_id is required'}),
                'isBase64Encoded': False
            }
        
        cur.execute("UPDATE pins SET views = views + 1 WHERE id = %s RETURNING views", (pin_id,))
        result = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        if not result:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Pin not found'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'views': result[0]}),
            'isBase64Encoded': False
        }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
