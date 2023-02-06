# localpermits.app
This is a static site that enables people living in Philadelphia to easily check if there will be demolition near their home.

## Why track demos?
Many parts of Philadelphia have toxic chemicals in the buildings and even in the ground. Demolitions can kick up dust and particles that can lead to health risks, especially in children. If a demo will be happening near you, you should look up how to prepare safely for it to protect your children, pets, and yourselves.

## Code Structure:
- Client - the TypeScript+React based client that is generated and served statically.
- Server - very simple, bare bones Go based logging static file server
- Combine - small tool used by the client project. It finds placeholders in the project template and inserts all available TSX files there. Then code that runs on load transpiles to react when the page loads.