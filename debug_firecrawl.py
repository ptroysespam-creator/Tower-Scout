from firecrawl import FirecrawlApp
import inspect
app = FirecrawlApp(api_key="123")
# Check if app.v1 exists
if app.v1:
    print(inspect.signature(app.v1.scrape_url))
else:
    print("app.v1 is None")
