using BGT_Web_Account.DB.Context;
using BGT_Web_Account.Interfaces;
using BGT_Web_Account.Repository;
using BGT_Web_Account.Services.Account;
using BGT_Web_Account.Services.OTP;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Net.Mail;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddMemoryCache();

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddScoped<IAccountRepository, AccountRepository>();
builder.Services.AddScoped<IAccountService, AccountService>();

builder.Services.AddScoped<OTPSender>(); 
builder.Services.AddScoped<IEmailSender, EmailSender>();
builder.Services.AddScoped<OTPVerifier>();


builder.Services.AddDbContext<AccDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Add CORS middleware before authorization
app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

app.Run(); 