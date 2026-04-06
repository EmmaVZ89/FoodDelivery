using System.Text;
using System.Threading.RateLimiting;
using DotNetEnv;
using Microsoft.AspNetCore.RateLimiting;
using LosDeLuna.API.Middleware;
using LosDeLuna.Core.Interfaces;
using LosDeLuna.Infra.Data;
using LosDeLuna.Infra.Repositories;
using LosDeLuna.Infra.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

// Load .env file
Env.Load(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", ".env"));

var builder = WebApplication.CreateBuilder(args);

// Database
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? throw new InvalidOperationException("DATABASE_URL not configured");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// Repositories & UnitOfWork
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IBusinessConfigService, BusinessConfigService>();
builder.Services.AddScoped<OrderService>();

// JWT Authentication
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET")
    ?? throw new InvalidOperationException("JWT_SECRET not configured");
var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "lodeluna-api";
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "lodeluna-app";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
});

// CORS
var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "http://localhost:4200";
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(frontendUrl)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;
    options.AddFixedWindowLimiter("auth", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
    });
    options.AddFixedWindowLimiter("general", opt =>
    {
        opt.PermitLimit = 60;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
    });
});

// Controllers
builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

// Middleware pipeline
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// Static files for uploaded images
var storagePath = Environment.GetEnvironmentVariable("STORAGE_PATH") ?? "./storage";
Directory.CreateDirectory(storagePath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
        Path.GetFullPath(storagePath)),
    RequestPath = "/uploads"
});

app.MapControllers();

// Serve Angular SPA in production
if (!app.Environment.IsDevelopment())
{
    var wwwPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
    if (Directory.Exists(wwwPath))
    {
        app.UseStaticFiles(); // serves wwwroot
        app.MapFallbackToFile("index.html"); // SPA routing
    }
}

// Auto-migrate
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.Run();
