# PDF Processor API

A simple Express.js API that processes PDF files using `pdftk` to extract the second page from uploaded PDFs.

## Features

- Upload PDF files via HTTP POST
- Extract the second page from PDFs using `pdftk`
- Return the processed PDF file
- API key authentication for security
- File size limit: 10MB
- Automatic cleanup of temporary files

## Prerequisites

- Node.js (v14 or higher)
- `pdftk` installed on your system

### Installing pdftk

**Ubuntu/Debian:**
```bash
sudo apt-get install pdftk
```

**macOS:**
```bash
brew install pdftk-java
```

**Windows:**
Download from [PDFtk Server](https://www.pdflabs.com/tools/pdftk-server/)

## Installation

1. Clone or navigate to the project directory
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env .env.local
# Edit .env.local and change the API_KEY to a secure value
```

4. Build the TypeScript code:
```bash
npm run build
```

## Running the Server

### Development mode:
```bash
npm run dev
```

### Production mode:
```bash
npm run build
npm start
```

The server will start on port 3000 by default (or the port specified in the `PORT` environment variable).

## API Endpoints

### Health Check
```
GET /health
```

Returns the server status.

**Request:**
- Headers: `Authorization: Bearer <API_KEY>`

**Response:**
```json
{
  "status": "OK",
  "message": "PDF processing API is running"
}
```

### Process PDF
```
POST /process-pdf
```

Uploads a PDF file and returns a new PDF containing only the second page.

**Request:**
- Method: POST
- Headers: `Authorization: Bearer <API_KEY>`
- Content-Type: multipart/form-data
- Body: PDF file with field name `pdf`

**Response:**
- Success: Returns the processed PDF file as a download
- Error: JSON error message

## Usage Examples

### Using curl:
```bash
curl -X POST \
  -H "Authorization: Bearer your-secret-api-key-here" \
  -F "pdf=@/path/to/your/input.pdf" \
  -o output.pdf \
  http://localhost:3000/process-pdf
```

### Using JavaScript/Fetch:
```javascript
const formData = new FormData();
formData.append('pdf', pdfFile);

fetch('http://localhost:3000/process-pdf', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-secret-api-key-here'
  },
  body: formData
})
.then(response => response.blob())
.then(blob => {
  // Handle the processed PDF blob
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'processed.pdf';
  a.click();
});
```

### Using Python requests:
```python
import requests

headers = {
    'Authorization': 'Bearer your-secret-api-key-here'
}

with open('input.pdf', 'rb') as f:
    files = {'pdf': f}
    response = requests.post(
        'http://localhost:3000/process-pdf',
        files=files,
        headers=headers
    )

    if response.status_code == 200:
        with open('output.pdf', 'wb') as output_file:
            output_file.write(response.content)
    else:
        print(f"Error: {response.json()}")
```

## Error Handling

The API handles various error scenarios:

- **401 Unauthorized**: Missing or invalid Authorization header
- **403 Forbidden**: Invalid API key
- **400 Bad Request**: No file uploaded, invalid file type, or PDF processing errors
- **413 Payload Too Large**: File exceeds 10MB limit
- **500 Internal Server Error**: Server-side processing errors

## Error Response Format

```json
{
  "error": "Error description",
  "details": "Additional error details"
}
```

## Common Error Cases

1. **No second page**: If the PDF doesn't have a second page, the API will return an error
2. **Corrupted PDF**: Invalid or corrupted PDF files will cause processing errors
3. **Large files**: Files over 10MB will be rejected
4. **Non-PDF files**: Only PDF files are accepted

## Environment Variables

- `PORT`: Server port (default: 3000)
- `API_KEY`: Required API key for authentication
- `BASIC_AUTH_USERNAME`: Basic authentication username (default: admin)
- `BASIC_AUTH_PASSWORD`: Basic authentication password (default: password)

## File Structure

```
swa-pdf/
├── server.ts          # Main server file
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript configuration
├── test.html          # Test HTML file
├── README.md          # This file
├── uploads/           # Temporary upload directory (created automatically)
├── output/            # Temporary output directory (created automatically)
└── dist/              # Compiled JavaScript (created after build)
```

## Security Considerations

- API key authentication is required for all endpoints
- File size limits are enforced
- Only PDF files are accepted
- Temporary files are automatically cleaned up
- Input validation is performed on uploaded files
- Change the default API key in production

## Troubleshooting

1. **Authentication errors**: Ensure you're using the correct API key from your `.env` file
2. **pdftk not found**: Ensure `pdftk` is installed and available in your system PATH
3. **Permission errors**: Ensure the application has write permissions for the upload and output directories
4. **Port conflicts**: Change the PORT environment variable if port 3000 is already in use
5. **Missing API_KEY**: Ensure the `API_KEY` environment variable is set in your `.env` file

## License

MIT
