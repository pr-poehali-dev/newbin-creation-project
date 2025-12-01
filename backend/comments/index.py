'''
Business: Manage comments - create and list by pin
Args: event - dict with httpMethod, body, queryStringParameters
      context - object with request_id attribute
Returns: HTTP response with comments data or error
'''

import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
        pin_id = params.get('pin_id')
        
        if not pin_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'pin_id is required'}),
                'isBase64Encoded': False
            }
        
        cur.execute(
            """SELECT c.id, c.content, c.created_at, u.username, u.id as author_id
               FROM comments c
               JOIN users u ON c.author_id = u.id
               WHERE c.pin_id = %s
               ORDER BY c.created_at ASC""",
            (pin_id,)
        )
        comments = cur.fetchall()
        
        result = []
        for comment in comments:
            result.append({
                'id': comment[0],
                'content': comment[1],
                'date': comment[2].isoformat(),
                'author': comment[3],
                'author_id': comment[4]
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'comments': result}),
            'isBase64Encoded': False
        }
    
    elif method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        pin_id = body_data.get('pin_id')
        author_id = body_data.get('author_id')
        content = body_data.get('content', '').strip()
        
        if not pin_id or not author_id or not content:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'pin_id, author_id and content are required'}),
                'isBase64Encoded': False
            }
        
        cur.execute(
            """INSERT INTO comments (pin_id, author_id, content)
               VALUES (%s, %s, %s)
               RETURNING id, content, created_at""",
            (pin_id, author_id, content)
        )
        comment = cur.fetchone()
        conn.commit()
        
        cur.execute("SELECT username FROM users WHERE id = %s", (author_id,))
        author = cur.fetchone()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'id': comment[0],
                'content': comment[1],
                'date': comment[2].isoformat(),
                'author': author[0] if author else 'Unknown',
                'author_id': author_id
            }),
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
