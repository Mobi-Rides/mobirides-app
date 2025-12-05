// Dynamic import for admin users with roles
      try {
        const handler = await import('./api/admin/users-with-roles.js');
        await handler.default(req, res);
      } catch (importError) {
        console.error('Failed to import admin users with roles handler:', importError);
        res.status(500).json({ error: 'Admin users with roles service unavailable' });
      }
    } else if (apiPath === 'admin/assign-role') {
      // Dynamic import for admin assign role
      try {
        const handler = await import('./api/admin/assign-role.js');
        await handler.default(req, res);
      } catch (importError) {
        console.error('Failed to import admin assign role handler:', importError);
        res.status(500).json({ error: 'Admin assign role service unavailable' });
      }
    } else if (apiPath === 'admin/capabilities') {
      // Dynamic import for admin capabilities
      try {
        const handler = await import('./api/admin/capabilities.js');
        await handler.default(req, res);
      } catch (importError) {
        console.error('Failed to import admin capabilities handler:', importError);
        res.status(500).json({ error: 'Admin capabilities service unavailable' });
      }
    } else if (apiPath === 'admin/user-capabilities') {
      // Dynamic import for admin user capabilities
      try {
        const handler = await import('./api/admin/user-capabilities.js');
        await handler.default(req, res);
      } catch (importError) {
        console.error('Failed to import admin user capabilities handler:', importError);
        res.status(500).json({ error: 'Admin user capabilities service unavailable' });
      }
    } else if (apiPath === 'admin/bulk-assign-role') {
      // Dynamic import for admin bulk assign role
      try {
        const handler = await import('./api/admin/bulk-assign-role.js');
        await handler.default(req, res);
      } catch (importError) {
        console.error('Failed to import admin bulk assign role handler:', importError);
        res.status(500).json({ error: 'Admin bulk assign role service unavailable' });
      }
    } else {
=======
    } else {
